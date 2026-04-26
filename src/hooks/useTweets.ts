import { useCallback, useEffect, useState } from "react";
import { getTweetsWithClassification, type TweetWithClassification } from "@/services/tweets.service";
import { ingestMockTweets } from "@/services/ingestion.service";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export type TweetItem = TweetWithClassification;

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
