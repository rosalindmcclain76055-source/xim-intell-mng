import { TopBar } from "@/components/app/TopBar";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { faIR, enUS } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export default function Published() {
  const { currentWorkspace } = useWorkspace();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "fa" ? faIR : enUS;
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (!currentWorkspace) return;
    supabase.from("drafts").select("*, tweet:tweets(source_handle)").eq("workspace_id", currentWorkspace.id).eq("status", "published").order("published_at", { ascending: false }).then(({ data }) => setItems(data ?? []));
  }, [currentWorkspace]);
  return (
    <>
      <TopBar title={t("published.title")} subtitle={t("published.subtitle")} />
      <div className="p-6 space-y-3 animate-fade-in">
        {items.length === 0 ? <Card className="p-12 text-center text-sm text-muted-foreground">{t("published.empty")}</Card>
          : items.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-[10px] font-mono uppercase">{d.action_type}</Badge>
                <span className="text-[11px] text-muted-foreground">{d.published_at && formatDistanceToNow(new Date(d.published_at), { addSuffix: true, locale: dateLocale })}</span>
              </div>
              <p className="text-sm font-mono leading-relaxed">{d.draft_text}</p>
            </Card>
          ))}
      </div>
    </>
  );
}
