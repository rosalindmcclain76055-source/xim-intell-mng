import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              "You write short, high-signal posts for X (Twitter). Return only the final draft text, under 270 characters.",
          },
          {
            role: "user",
            content: `Create a concise reply draft for this tweet:\n\n${source}`,
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI ERROR:", aiRes.status, t);
      return "";
    }

    const aiJson = await aiRes.json();
    const modelOutput = aiJson?.choices?.[0]?.message?.content;
    if (!isNonEmptyString(modelOutput)) return "";

    return modelOutput.trim().replace(/^['"“”]+|['"“”]+$/g, "") || "Draft unavailable";
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
      throw new Error("Supabase environment is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new Error("Invalid JSON body");
    }

    console.log("GENERATE INPUT:", body);

    if (!body || typeof body !== "object") {
      throw new Error("Request body is required");
    }

    const payload = body as Record<string, unknown>;
    const tweetId = payload.tweet_id;
    const workspaceId = payload.workspace_id;

    if (!isNonEmptyString(tweetId)) {
      throw new Error("tweet_id is required and must be a string");
    }
    if (!isNonEmptyString(workspaceId)) {
      throw new Error("workspace_id is required and must be a string");
    }
    if (!UUID_RE.test(tweetId)) {
      throw new Error("tweet_id must be a valid UUID");
    }
    if (!UUID_RE.test(workspaceId)) {
      throw new Error("workspace_id must be a valid UUID");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      throw new Error("Invalid session");
    }

    const { data: tweet, error: tweetErr } = await supabase
      .from("tweets")
      .select("id, workspace_id, text")
      .eq("id", tweetId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (tweetErr) {
      console.error("DB ERROR:", tweetErr);
      throw new Error(`Failed to load tweet: ${tweetErr.message}`);
    }

    if (!tweet) {
      throw new Error("Tweet not found for the provided workspace_id");
    }

    const { data: canEdit, error: roleError } = await supabase.rpc("can_edit_workspace", {
      _workspace_id: workspaceId,
      _user_id: userData.user.id,
    });
    if (roleError) {
      console.error("DB ERROR:", roleError);
      throw new Error(`Failed role check: ${roleError.message}`);
    }
    if (!canEdit) {
      throw new Error("You do not have permission to create drafts in this workspace");
    }

    const generatedText = await generateContent(tweet.text ?? "");
    console.log("AI OUTPUT:", generatedText);

    const tweetPreview = typeof tweet.text === "string" ? tweet.text.trim() : "";
    const fallback = `Interesting point on "${tweetPreview.slice(0, 80)}..." — worth discussing.`;
    const content = isNonEmptyString(generatedText) ? generatedText : fallback;

    const row = {
      workspace_id: workspaceId,
      tweet_id: tweetId,
      content,
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

    return json(200, data as Record<string, unknown>);
  } catch (err) {
    console.error("EDGE ERROR:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return json(400, { error: message });
  }
});
