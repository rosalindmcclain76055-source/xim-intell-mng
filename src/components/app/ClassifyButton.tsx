import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { classifyTweet } from "@/services/classification.service";
import type { Database } from "@/integrations/supabase/types";

type ClassificationRow = Database["public"]["Tables"]["classifications"]["Row"];

type TweetInput = {
  id: string;
  workspace_id: string;
  text: string;
  source_handle?: string | null;
  hashtags?: string[] | null;
};

interface ClassifyButtonProps {
  tweet: TweetInput;
  onClassified?: (classification: ClassificationRow) => void;
  size?: "sm" | "default";
}

export function ClassifyButton({ tweet, onClassified, size = "sm" }: ClassifyButtonProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const run = async () => {
    setLoading(true);
    try {
      const classification = await classifyTweet(tweet);
      const decision = classification.final_decision;
      const decisionLabel = t(`decisions.${decision}`, { defaultValue: decision.replace("_", " ") });
      toast.success(t("classifyBtn.classified", { decision: decisionLabel }));
      onClassified?.(classification);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("classifyBtn.failed");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size={size} disabled={loading} onClick={run} className="h-7">
      {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Brain className="w-3.5 h-3.5 mr-1" />}
      {t("classifyBtn.classify")}
    </Button>
  );
}
