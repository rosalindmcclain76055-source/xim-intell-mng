import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sparkles, Loader2, ChevronDown, MessageSquare, Quote, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type ActionType = "reply" | "quote" | "post";

interface GenerateDraftButtonProps {
  tweetId: string;
  accountId?: string | null;
  onGenerated?: () => void;
  size?: "sm" | "default";
}

export function GenerateDraftButton({ tweetId, accountId, onGenerated, size = "sm" }: GenerateDraftButtonProps) {
  const [loading, setLoading] = useState<ActionType | null>(null);
  const { t } = useTranslation();

  const generate = async (action: ActionType) => {
    setLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke("generate-draft", {
        body: { tweet_id: tweetId, action_type: action, account_id: accountId ?? null },
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
      if (data?.draft) {
        toast.success(t("draftBtn.createdToast"));
        onGenerated?.();
      }
    } catch (e: any) {
      toast.error(e?.message ?? t("draftBtn.failed"));
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
          {t("draftBtn.draft")}
          <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => generate("reply")} disabled={isLoading}>
          <MessageSquare className="w-3.5 h-3.5 mr-2" /> {t("draftBtn.reply")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate("quote")} disabled={isLoading}>
          <Quote className="w-3.5 h-3.5 mr-2" /> {t("draftBtn.quote")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate("post")} disabled={isLoading}>
          <Send className="w-3.5 h-3.5 mr-2" /> {t("draftBtn.standalonePost")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
