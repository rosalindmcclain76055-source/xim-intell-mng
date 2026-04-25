import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sparkles, Loader2, ChevronDown, MessageSquare, Quote, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ActionType = "reply" | "quote" | "post";

interface GenerateDraftButtonProps {
  tweetId: string;
  accountId?: string | null;
  onGenerated?: () => void;
  size?: "sm" | "default";
}

export function GenerateDraftButton({ tweetId, accountId, onGenerated, size = "sm" }: GenerateDraftButtonProps) {
  const [loading, setLoading] = useState<ActionType | null>(null);

  const generate = async (action: ActionType) => {
    setLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke("generate-draft", {
        body: { tweet_id: tweetId, action_type: action, account_id: accountId ?? null },
      });
      if (error) {
        // edge function returns JSON error body; supabase wraps it
        const ctx: any = (error as any).context;
        let msg = error.message;
        try {
          const body = ctx && typeof ctx.body === "string" ? JSON.parse(ctx.body) : null;
          if (body?.error) msg = body.error;
        } catch { /* ignore */ }
        toast.error(msg);
        return;
      }
      if (data?.draft) {
        toast.success(`Draft created — review it in the Queue.`);
        onGenerated?.();
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate draft");
    } finally {
      setLoading(null);
    }
  };

  const isLoading = loading !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} disabled={isLoading} className="h-7">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 mr-1" />
          )}
          Draft
          <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => generate("reply")} disabled={isLoading}>
          <MessageSquare className="w-3.5 h-3.5 mr-2" /> Reply
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate("quote")} disabled={isLoading}>
          <Quote className="w-3.5 h-3.5 mr-2" /> Quote
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate("post")} disabled={isLoading}>
          <Send className="w-3.5 h-3.5 mr-2" /> Standalone post
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
