import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClassifyButtonProps {
  tweetId: string;
  onClassified?: (decision: string) => void;
  size?: "sm" | "default";
}

export function ClassifyButton({ tweetId, onClassified, size = "sm" }: ClassifyButtonProps) {
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("classify-tweet", {
        body: { tweet_id: tweetId },
      });
      if (error) {
        const ctx: any = (error as any).context;
        let msg = error.message;
        try {
          const body = ctx && typeof ctx.body === "string" ? JSON.parse(ctx.body) : null;
          if (body?.error) msg = body.error;
        } catch { /* ignore */ }
        toast.error(msg);
        return;
      }
      const decision = data?.classification?.final_decision;
      if (decision) {
        toast.success(`Classified → ${decision.replace("_", " ")}`);
        onClassified?.(decision);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to classify");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size={size} disabled={loading} onClick={run} className="h-7">
      {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Brain className="w-3.5 h-3.5 mr-1" />}
      Classify
    </Button>
  );
}
