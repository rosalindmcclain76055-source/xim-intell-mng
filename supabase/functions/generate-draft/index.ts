import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY") ??
  "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function generateContent(sourceTweet: string): Promise<string> {
  const source = sourceTweet.trim();
  if (!source) return "";

  if (!LOVABLE_API_KEY) {
    return `Draft: ${source.slice(0, 240)}`;
  }

  try {
    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You write short, high-signal posts for X. Return only final text under 270 chars.",
            },
            {
              role: "user",
              content: `Create a concise reply draft:\n\n${source}`,
            },
          ],
        }),
      }
    );

    if (!aiRes.ok) {
      console.error("AI ERROR:", await aiRes.text());
      return "";
    }

    const aiJson = await aiRes.json();
    const output = aiJson?.choices?.[0]?.message?.content;

    return isNonEmptyString(output)
      ? output.trim().replace(/^['"“”]+|['"“”]+$/g, "")
      : "";
  } catch (err) {
    console.error("AI ERROR:", err);
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(400, { error: "Method not allowed" });

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization");

    const body = await req.json();
    console.log("GENERATE INPUT:", body);

    const tweetId = body?.tweet_id;
    const workspaceId = body?.workspace_id;

    if (!isNonEmptyString(tweetId)) throw new Error("tweet_id required");
    if (!isNonEmptyString(workspaceId)) throw new Error("workspace_id required");
    if (!UUID_RE.test(tweetId)) throw new Error("Invalid tweet_id");
    if (!UUID_RE.test(workspaceId)) throw new Error("Invalid workspace_id");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) throw new Error("Invalid session");

    // ✅ Fetch tweet
    const { data: tweet, error: tweetErr } = await supabase
      .from("tweets")
      .select("id, workspace_id, text")
      .eq("id", tweetId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (tweetErr) throw new Error(tweetErr.message);
    if (!tweet) throw new Error("Tweet not found");

    // ✅ FIXED RPC PARAMS HERE
    const { data: canEdit, error: roleError } = await supabase.rpc(
      "can_edit_workspace",
      {
        p_workspace_id: workspaceId,
        p_user_id: userData.user.id,
      }
    );

    if (roleError) throw new Error(roleError.message);
    if (!canEdit) throw new Error("No permission");

    // ✅ Generate content
    const aiText = await generateContent(tweet.text ?? "");
    console.log("AI OUTPUT:", aiText);

    const fallback = `Interesting point on "${(tweet.text ?? "").slice(
      0,
      80
    )}..."`;

    const content = isNonEmptyString(aiText) ? aiText : fallback;

    // ✅ IMPORTANT: match your DB schema
    const row = {
      workspace_id: workspaceId,
      tweet_id: tweetId,
      draft_text: content, // 🔥 CHANGE HERE (not "content")
      status: "pending",
    };

    console.log("INSERT PAYLOAD:", row);

    const { data, error } = await supabase
      .from("drafts")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("DB ERROR:", error);
      throw new Error(error.message);
    }

    return json(200, data);
  } catch (err) {
    console.error("EDGE ERROR:", err);
    return json(400, {
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
});
