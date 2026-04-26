import { useCallback, useEffect, useState } from "react";
import { getTweetsWithClassification } from "@/services/tweets.service";
import type { Database } from "@/integrations/supabase/types";
import { ingestMockTweets } from "@/services/ingestion.service";
import { useWorkspace } from "@/contexts/WorkspaceContext";

type TweetClassification = Pick<
  Database["public"]["Tables"]["classifications"]["Row"],
  "topic_score" | "source_score" | "actionability_score" | "risk_score" | "final_score" | "final_decision"
>;

export interface TweetItem {
  id: string;
  text: string;
  author_handle: string;
  created_at: string;
  classifications: TweetClassification[];
}

export function useTweets() {
  const { currentWorkspace } = useWorkspace();
  const [tweets, setTweets] = useState<TweetItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTweets = useCallback(async () => {
    if (!currentWorkspace) {
      setTweets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getTweetsWithClassification(currentWorkspace.id);
    setTweets(data);
    setLoading(false);
  }, [currentWorkspace]);

  const ingest = useCallback(async () => {
    if (!currentWorkspace) return;
    await ingestMockTweets(currentWorkspace.id);
    await loadTweets();
  }, [currentWorkspace, loadTweets]);

  useEffect(() => {
    void loadTweets();
  }, [loadTweets]);

  return { tweets, loading, ingest };
}
