import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/integrations/supabase/types";
import type { Tweet } from "@/types/tweet";

type TweetClassification = Pick<
  Database["public"]["Tables"]["classifications"]["Row"],
  "topic_score" | "source_score" | "actionability_score" | "risk_score" | "final_score" | "final_decision"
>;

export type TweetWithClassification = Tweet & {
  created_at: string;
  classifications: TweetClassification[];
};

export async function getTweetsWithClassification(workspaceId: string): Promise<TweetWithClassification[]> {
  const { data, error } = await supabase
    .from("tweets")
    .select(`
      id,
      workspace_id,
      text,
      source_handle,
      hashtags,
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
    workspace_id: tweet.workspace_id,
    text: tweet.text,
    source_handle: tweet.source_handle,
    hashtags: tweet.hashtags,
    created_at: tweet.created_at,
    classifications: tweet.classifications ?? [],
  }));
}
