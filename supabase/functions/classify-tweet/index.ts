// Classify a tweet using Lovable AI (LLM-only, no embeddings).
// Auth: editor/admin in the tweet's workspace.
// Input:  { tweet_id: uuid }
// Output: { classification: { topic_score, source_score, actionability_score, risk_score, final_decision, reasoning, matched_keywords } }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const MODEL = "google/gemini-2.5-flash";
const MODEL_VERSION = `${MODEL}@v1`;

type Decision = "ignore" | "review" | "draft_reply" | "draft_quote" | "draft_post";

function bad(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clamp(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return bad(405, "Method not allowed");

  try {
    if (!LOVABLE_API_KEY) return bad(500, "LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return bad(401, "Missing Authorization header");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return bad(401, "Invalid session");
    const userId = userData.user.id;

    let body: any;
    try { body = await req.json(); } catch { return bad(400, "Invalid JSON body"); }
    const tweetId: string | undefined = body?.tweet_id;
    if (!tweetId || typeof tweetId !== "string") return bad(400, "tweet_id is required");

    // ---- load tweet ----
    const { data: tweet, error: tweetErr } = await supabase
      .from("tweets")
      .select("id, workspace_id, text, source_handle, source_display_name, hashtags")
      .eq("id", tweetId)
      .maybeSingle();
    if (tweetErr) return bad(500, tweetErr.message);
    if (!tweet) return bad(404, "Tweet not found or not accessible");
    const workspaceId = tweet.workspace_id;

    // ---- role check ----
    const { data: canEdit, error: roleErr } = await supabase.rpc("can_edit_workspace", {
      _workspace_id: workspaceId,
      _user_id: userId,
    });
    if (roleErr) return bad(500, roleErr.message);
    if (!canEdit) return bad(403, "You need editor or admin role");

    // ---- gather workspace context: watch sources + persona signal ----
    const { data: sources } = await supabase
      .from("watch_sources")
      .select("source_type, source_value, priority")
      .eq("workspace_id", workspaceId)
      .eq("enabled", true)
      .order("priority", { ascending: false })
      .limit(40);

    const keywords = (sources ?? [])
      .filter((s) => s.source_type === "keyword" || s.source_type === "concept")
      .map((s) => s.source_value);
    const trustedHandles = (sources ?? [])
      .filter((s) => s.source_type === "account")
      .map((s) => s.source_value.replace(/^@/, "").toLowerCase());

    const { data: ws } = await supabase
      .from("workspaces")
      .select("default_persona_id, default_risk_ceiling")
      .eq("id", workspaceId)
      .maybeSingle();

    let personaSummary = "neutral expert voice";
    if (ws?.default_persona_id) {
      const { data: persona } = await supabase
        .from("persona_profiles")
        .select("name, tone, expertise_domain, risk_tolerance, description")
        .eq("id", ws.default_persona_id)
        .maybeSingle();
      if (persona) {
        personaSummary = `${persona.name} — ${persona.expertise_domain ?? "general"} — tone: ${persona.tone ?? "neutral"} — risk: ${persona.risk_tolerance ?? "medium"}${persona.description ? ` — ${persona.description}` : ""}`;
      }
    }

    // ---- prompt ----
    const system = `You are a strict tweet-triage classifier for a professional account.
You score every tweet on four 0-100 scales and choose ONE final decision.

SCALES (0-100):
- topic_score: how relevant the tweet is to the workspace topics/keywords listed below.
- source_score: how trusted/influential the author is. 100 if handle is in trusted list. 0 for spam/anon.
- actionability_score: how clearly there is something useful to add (insight, correction, expansion). Pure news without hook = low.
- risk_score: probability that responding could backfire (politics, personal attacks, legal, medical, breaking news without facts, NSFW, identity, harassment, controversial figures). HIGHER = MORE DANGEROUS.

DECISION RULES (apply in order):
1. risk_score >= 60 OR topic_score < 30  -> "ignore"
2. risk_score >= 40                       -> "review"
3. actionability_score >= 70 AND tweet ends with a question or asks for opinions -> "draft_reply"
4. actionability_score >= 60 AND topic_score >= 60 -> "draft_quote"
5. topic_score >= 70 AND actionability_score < 60  -> "draft_post"
6. otherwise -> "review"

Return your answer ONLY via the provided tool call.`;

    const user = `Workspace persona: ${personaSummary}
Workspace risk ceiling: ${ws?.default_risk_ceiling ?? 40} (drafts above this need human review)

Watched keywords/concepts: ${keywords.length ? keywords.join(", ") : "(none)"}
Trusted handles: ${trustedHandles.length ? trustedHandles.map((h) => "@" + h).join(", ") : "(none)"}

Tweet:
- Author: @${tweet.source_handle}${tweet.source_display_name ? ` (${tweet.source_display_name})` : ""}
- Text: "${tweet.text}"
- Hashtags: ${(tweet.hashtags ?? []).join(", ") || "(none)"}

Score it and decide.`;

    const tool = {
      type: "function" as const,
      function: {
        name: "classify_tweet",
        description: "Return the four scores, decision, brief reasoning, and matched keywords.",
        parameters: {
          type: "object",
          properties: {
            topic_score: { type: "integer", minimum: 0, maximum: 100 },
            source_score: { type: "integer", minimum: 0, maximum: 100 },
            actionability_score: { type: "integer", minimum: 0, maximum: 100 },
            risk_score: { type: "integer", minimum: 0, maximum: 100 },
            final_decision: { type: "string", enum: ["ignore", "review", "draft_reply", "draft_quote", "draft_post"] },
            reasoning: { type: "string", description: "1-2 sentence justification, max 240 chars." },
            matched_keywords: { type: "array", items: { type: "string" }, description: "Keywords from the watched list that appear in or relate to the tweet." },
          },
          required: ["topic_score", "source_score", "actionability_score", "risk_score", "final_decision", "reasoning", "matched_keywords"],
          additionalProperties: false,
        },
      },
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "classify_tweet" } },
      }),
    });

    if (aiRes.status === 429) return bad(429, "AI rate limit hit. Try again shortly.");
    if (aiRes.status === 402) return bad(402, "AI credits exhausted. Add funds in workspace settings.");
    if (!aiRes.ok) {
      console.error("AI gateway error", aiRes.status, await aiRes.text());
      return bad(502, "AI gateway error");
    }
    const aiJson = await aiRes.json();
    const call = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) return bad(502, "AI did not return classification");

    let parsed: any;
    try { parsed = JSON.parse(call.function.arguments); } catch { return bad(502, "AI returned invalid JSON"); }

    const row = {
      tweet_id: tweetId,
      workspace_id: workspaceId,
      topic_score: clamp(parsed.topic_score),
      source_score: clamp(parsed.source_score),
      actionability_score: clamp(parsed.actionability_score),
      risk_score: clamp(parsed.risk_score),
      final_decision: (["ignore", "review", "draft_reply", "draft_quote", "draft_post"].includes(parsed.final_decision)
        ? parsed.final_decision
        : "review") as Decision,
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning.slice(0, 500) : null,
      matched_keywords: Array.isArray(parsed.matched_keywords)
        ? parsed.matched_keywords.filter((k: any) => typeof k === "string").slice(0, 20)
        : [],
      model_version: MODEL_VERSION,
    };

    // upsert on tweet_id
    const { data: saved, error: upsertErr } = await supabase
      .from("classifications")
      .upsert(row, { onConflict: "tweet_id" })
      .select("topic_score, source_score, actionability_score, risk_score, final_decision, reasoning, matched_keywords")
      .single();
    if (upsertErr) return bad(500, upsertErr.message);

    await supabase.from("audit_logs").insert({
      workspace_id: workspaceId,
      actor_id: userId,
      event_type: "tweet.classified",
      entity_type: "tweet",
      entity_id: tweetId,
      summary: `Classified @${tweet.source_handle} → ${row.final_decision} (risk ${row.risk_score})`,
      metadata: { model: MODEL_VERSION, scores: { topic: row.topic_score, source: row.source_score, actionability: row.actionability_score, risk: row.risk_score } },
    });

    return new Response(JSON.stringify({ classification: saved }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify-tweet error", e);
    return bad(500, e instanceof Error ? e.message : "Unknown error");
  }
});
