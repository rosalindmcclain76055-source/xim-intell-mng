// Generate an AI draft for a given tweet.
// Auth: requires a logged-in user with editor/admin role in the tweet's workspace.
// Input:  { tweet_id: uuid, action_type: "reply" | "quote" | "post", account_id?: uuid, persona_id?: uuid }
// Output: { draft: { id, draft_text, action_type, status } }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

type ActionType = "reply" | "quote" | "post";

function bad(status: number, message: string, extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return bad(400, "Method not allowed");

  try {
    if (!LOVABLE_API_KEY) return bad(400, "LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return bad(400, "Missing Authorization header");

    // Per-request client carries the user's JWT, so RLS applies.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return bad(400, "Invalid session");
    const userId = userData.user.id;

    // ---- validate input ----
    let body: any;
    try {
      body = await req.json();
    } catch {
      return bad(400, "Invalid JSON body");
    }
    const tweetId: string | undefined = body?.tweet_id;
    const actionType: ActionType | undefined = body?.action_type;
    const accountId: string | null = body?.account_id ?? null;
    const personaIdOverride: string | null = body?.persona_id ?? null;

    if (!tweetId || typeof tweetId !== "string") return bad(400, "tweet_id is required");
    if (!actionType || !["reply", "quote", "post"].includes(actionType)) {
      return bad(400, "action_type must be reply, quote, or post");
    }

    // ---- load tweet (RLS gates workspace access) ----
    const { data: tweet, error: tweetErr } = await supabase
      .from("tweets")
      .select("id, workspace_id, text, source_handle, source_display_name, hashtags")
      .eq("id", tweetId)
      .maybeSingle();
    if (tweetErr) {
      console.error("Failed to load tweet", tweetErr);
      return bad(400, tweetErr.message);
    }
    if (!tweet) return bad(400, "Tweet not found or not accessible");

    const workspaceId = tweet.workspace_id;

    // ---- enforce editor/admin via SECURITY DEFINER helper ----
    const { data: canEdit, error: roleErr } = await supabase.rpc("can_edit_workspace", {
      _workspace_id: workspaceId,
      _user_id: userId,
    });
    if (roleErr) {
      console.error("Role check failed", roleErr);
      return bad(400, roleErr.message);
    }
    if (!canEdit) return bad(400, "You need editor or admin role in this workspace");

    // ---- resolve persona: explicit > account default > workspace default ----
    let personaId: string | null = personaIdOverride;
    let resolvedAccountId: string | null = accountId;

    if (!personaId && resolvedAccountId) {
      const { data: acct } = await supabase
        .from("connected_accounts")
        .select("persona_profile_id")
        .eq("id", resolvedAccountId)
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      personaId = acct?.persona_profile_id ?? null;
    }
    if (!personaId) {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("default_persona_id")
        .eq("id", workspaceId)
        .maybeSingle();
      personaId = ws?.default_persona_id ?? null;
    }

    let persona: {
      name: string;
      tone: string | null;
      reply_style: string | null;
      expertise_domain: string | null;
      risk_tolerance: string | null;
      description: string | null;
    } | null = null;
    if (personaId) {
      const { data } = await supabase
        .from("persona_profiles")
        .select("name, tone, reply_style, expertise_domain, risk_tolerance, description")
        .eq("id", personaId)
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      persona = data ?? null;
    }

    // ---- build prompts ----
    const system = [
      "You write short, high-signal posts for X (Twitter).",
      "Hard rules:",
      "- Stay under 270 characters. No hashtags unless they appear in the source tweet.",
      "- No emojis unless the persona explicitly uses them.",
      "- Never use em-dashes or marketing fluff.",
      "- No @mentions unless replying to the original author.",
      "- If you are unsure or the topic is sensitive, return the literal text: SKIP",
      persona
        ? `Persona: "${persona.name}". Tone: ${persona.tone ?? "neutral, expert"}. Reply style: ${
            persona.reply_style ?? "direct"
          }. Domain: ${persona.expertise_domain ?? "general"}. Risk tolerance: ${
            persona.risk_tolerance ?? "medium"
          }.${persona.description ? " Notes: " + persona.description : ""}`
        : "Persona: neutral expert voice.",
    ].join("\n");

    const action =
      actionType === "reply"
        ? "Write a reply that adds a concrete insight or correction. Do not restate the tweet."
        : actionType === "quote"
          ? "Write a quote-tweet comment (max 270 chars) that frames the source tweet with a sharp take."
          : "Write a standalone post inspired by the source tweet's topic. Do not reference the author.";

    const user = [
      `Source tweet by @${tweet.source_handle}${tweet.source_display_name ? ` (${tweet.source_display_name})` : ""}:`,
      `"${tweet.text}"`,
      "",
      `Task: ${action}`,
      "Return ONLY the post text. No preamble, no quotes, no explanation.",
    ].join("\n");

    // ---- call Lovable AI ----
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (aiRes.status === 429) return bad(400, "AI rate limit hit. Try again shortly.");
    if (aiRes.status === 402) return bad(400, "AI credits exhausted. Add funds in workspace settings.");
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      return bad(400, "AI gateway error");
    }
    const aiJson = await aiRes.json();
    let draftText: string = aiJson?.choices?.[0]?.message?.content?.trim() ?? "";

    // strip wrapping quotes if model added them
    draftText = draftText.replace(/^["“”']+|["“”']+$/g, "").trim();

    if (!draftText || draftText.toUpperCase() === "SKIP") {
      return bad(400, "Model declined to draft (sensitive or low-signal topic).");
    }

    // ---- insert draft (RLS will check editor role) ----
    const payload = {
      workspace_id: workspaceId,
      tweet_id: tweetId,
      content: draftText,
      status: "pending",
    };
    if (!payload.tweet_id || !payload.workspace_id || !payload.content) {
      return bad(400, "tweet_id, workspace_id, and content are required");
    }
    console.log("INSERT PAYLOAD:", payload);

    const { data: inserted, error: insertErr } = await supabase
      .from("drafts")
      .insert(payload)
      .select("id, content, status")
      .single();

    if (insertErr) {
      console.error("Draft insert failed", insertErr);
      return bad(400, insertErr.message);
    }

    // best-effort audit log
    await supabase.from("audit_logs").insert({
      workspace_id: workspaceId,
      actor_id: userId,
      event_type: "draft.generated",
      entity_type: "draft",
      entity_id: inserted.id,
      summary: `AI drafted content for @${tweet.source_handle}`,
      metadata: { tweet_id: tweetId, persona_id: personaId, action_type: actionType, model: "google/gemini-2.5-flash" },
    });

    return new Response(JSON.stringify({ draft: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("EDGE ERROR:", e);
    return bad(400, e instanceof Error ? e.message : "Unknown error");
  }
});
