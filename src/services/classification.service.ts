import { supabase } from "@/lib/supabaseClient";
import { computeScore, decideAction } from "@/lib/classifier";
import type { Database } from "@/integrations/supabase/types";

type ClassificationRow = Database["public"]["Tables"]["classifications"]["Row"];

type TweetForClassification = {
  id: string;
  workspace_id: string;
  text: string;
  source_handle?: string | null;
  hashtags?: string[] | null;
};

function normalize(text: string): string {
  return text.toLowerCase();
}

function keywordDensity(text: string, keywords: string[]): number {
  if (!text.trim()) return 0;
  const normalized = normalize(text);
  const hits = keywords.filter((keyword) => normalized.includes(keyword)).length;
  return Math.min(1, hits / Math.max(1, keywords.length));
}

function computeTopicScore(tweet: TweetForClassification): number {
  const keywords = ["ai", "startup", "saas", "crypto", "growth", "product", "security", "policy"];
  const byKeywords = keywordDensity(tweet.text, keywords);
  const hashBonus = Math.min(0.3, (tweet.hashtags?.length ?? 0) * 0.05);
  return Math.min(1, byKeywords * 0.8 + hashBonus);
}

function computeSourceScore(tweet: TweetForClassification): number {
  const handle = tweet.source_handle?.toLowerCase() ?? "";
  if (!handle) return 0.25;
  if (["x", "news", "official"].some((signal) => handle.includes(signal))) return 0.85;
  if (handle.length < 4) return 0.2;
  return 0.55;
}

function computeActionabilityScore(tweet: TweetForClassification): number {
  const text = normalize(tweet.text);
  const asksQuestion = text.includes("?");
  const hasCallToAction = /(how|what|why|should|thoughts|help|launch|announce|breaking)/.test(text);
  const lengthBoost = Math.min(0.25, tweet.text.length / 600);

  return Math.min(1, (asksQuestion ? 0.4 : 0.2) + (hasCallToAction ? 0.35 : 0.1) + lengthBoost);
}

function computeRiskScore(tweet: TweetForClassification): number {
  const text = normalize(tweet.text);
  const riskSignals = ["rumor", "unverified", "hack", "leak", "lawsuit", "insider", "nsfw", "politics"];
  const ratio = keywordDensity(text, riskSignals);
  const capsRatio = (tweet.text.match(/[A-Z]/g)?.length ?? 0) / Math.max(1, tweet.text.length);
  return Math.min(1, ratio * 0.8 + Math.min(0.2, capsRatio));
}

export async function classifyTweet(tweet: TweetForClassification): Promise<ClassificationRow> {
  console.log("CLASSIFY INPUT →", tweet);
  const topic = computeTopicScore(tweet);
  const source = computeSourceScore(tweet);
  const actionability = computeActionabilityScore(tweet);
  const risk = computeRiskScore(tweet);

  const finalScore = computeScore({
    topic,
    source,
    actionability,
    risk,
  });

  const decision = decideAction(finalScore);
console.log("UPSERT PAYLOAD →", {
  tweet_id: tweet.id,
  workspace_id: tweet.workspace_id,
});
  const { data, error } = await supabase
    .from("classifications")
    .upsert(
      {
        tweet_id: tweet.id,
        workspace_id: tweet.workspace_id,
        topic_score: topic,
        source_score: source,
        actionability_score: actionability,
        risk_score: risk,
        final_score: finalScore,
        final_decision: decision,
        reasoning: `weighted_score=${finalScore.toFixed(3)} decision=${decision}`,
        model_version: "rule-based-v1",
      },
      { onConflict: "tweet_id" },
    )
    .select()
    .single();

  if (error) throw error;

  return data;
}
