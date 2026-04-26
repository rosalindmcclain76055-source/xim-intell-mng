import { supabase } from "@/lib/supabaseClient";

const sampleTweets = [
  {
    text: "AI is transforming SaaS growth strategies",
    author_handle: "sama",
  },
  {
    text: "Stablecoins are reshaping global payments",
    author_handle: "balajis",
  },
  {
    text: "We just shipped a new developer platform",
    author_handle: "openai",
  },
];

export async function ingestMockTweets(workspaceId: string) {
  const now = Date.now();
  const rows = sampleTweets.map((tweet, index) => ({
    workspace_id: workspaceId,
    tweet_id: `ingest_${now}_${index}`,
    text: tweet.text,
    source_handle: tweet.author_handle,
    source_display_name: tweet.author_handle,
  }));

  const { data, error } = await supabase.from("tweets").insert(rows).select();

  if (error) throw error;
  return data;
}
