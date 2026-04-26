import { supabase } from "@/lib/supabaseClient";

export async function getTweetsWithClassification(workspaceId: string) {
  const { data, error } = await supabase
    .from("tweets")
    .select(`
      id,
      text,
      source_handle,
      created_at,
      classifications (
        topic_score,
        source_score,
        actionability_score,
        risk_score,
        final_score,
        final_decision
      )
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((tweet) => ({
    id: tweet.id,
    text: tweet.text,
    author_handle: tweet.source_handle,
    created_at: tweet.created_at,
    classifications: tweet.classifications ?? [],
  }));
}
