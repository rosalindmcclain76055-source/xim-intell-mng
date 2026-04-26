import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  MessageSquare,
  Quote,
  Send,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@/contexts/WorkspaceContext";

type ActionType = "reply" | "quote" | "post";

interface GenerateDraftButtonProps {
  tweetId: string;
  onGenerated?: () => void;
  size?: "sm" | "default";
}

export function GenerateDraftButton({
  tweetId,
  onGenerated,
  size = "sm",
}: GenerateDraftButtonProps) {
  const [loading, setLoading] = useState<ActionType | null>(null);
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();

  const generate = async (action: ActionType) => {
    if (!currentWorkspace?.id) {
      toast.error("Workspace is required before generating a draft");
      return;
    }

    setLoading(action);

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-draft",
        {
          body: {
            tweet_id: tweetId,
            workspace_id: currentWorkspace.id,
            action_type: action, // ✅ CRITICAL FIX
          },
        }
      );

      // 🔴 Handle edge function errors properly
      if (error) {
        console.error("FUNCTION ERROR:", error);

        let message = error.message;

        try {
          const ctx: any = (error as any).context;
          const parsed =
            ctx?.body && typeof ctx.body === "string"
              ? JSON.parse(ctx.body)
              : null;

          if (parsed?.error) {
            message = parsed.error;
          }
        } catch {
          // ignore parse failure
        }

        toast.error(message);
        return;
      }

      // ✅ Success case
      if (data?.id) {
        toast.success(t("draftBtn.createdToast"));
        onGenerated?.();
        return;
      }

      // 🟡 Unexpected response
      console.error("INVALID RESPONSE:", data);
      toast.error(t("draftBtn.failed"));
    } catch (err: any) {
      console.error("UNCAUGHT ERROR:", err);
      toast.error(err?.message ?? t("draftBtn.failed"));
    } finally {
      setLoading(null);
    }
  };

  const isLoading = loading !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={isLoading}
          className="h-7"
        >
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
        <DropdownMenuItem
          onClick={() => generate("reply")}
          disabled={isLoading}
        >
          <MessageSquare className="w-3.5 h-3.5 mr-2" />
          {t("draftBtn.reply")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => generate("quote")}
          disabled={isLoading}
        >
          <Quote className="w-3.5 h-3.5 mr-2" />
          {t("draftBtn.quote")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => generate("post")}
          disabled={isLoading}
        >
          <Send className="w-3.5 h-3.5 mr-2" />
          {t("draftBtn.standalonePost")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
