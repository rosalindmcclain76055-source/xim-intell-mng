import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/app/TopBar";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { faIR, enUS } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

export default function Drafts() {
  const { currentWorkspace } = useWorkspace();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "fa" ? faIR : enUS;
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    if (!currentWorkspace) return;
    let q = supabase.from("drafts").select("*, tweet:tweets(text, source_handle)").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter as any);
    const { data } = await q;
    setItems(data ?? []);
  }, [currentWorkspace, filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <TopBar title={t("drafts.title")} subtitle={t("drafts.subtitle")} actions={
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
            <TabsTrigger value="pending">{t("common.pending")}</TabsTrigger>
            <TabsTrigger value="approved">{t("common.approved")}</TabsTrigger>
            <TabsTrigger value="rejected">{t("common.rejected")}</TabsTrigger>
            <TabsTrigger value="published">{t("common.published")}</TabsTrigger>
          </TabsList>
        </Tabs>
      } />
      <div className="p-6 animate-fade-in space-y-3">
        {items.length === 0 ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">{t("drafts.empty")}</Card>
        ) : items.map((d) => (
          <Card key={d.id} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-mono">{d.action_type}</Badge>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-mono">{t(`common.${d.status}`, { defaultValue: d.status })}</Badge>
              <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(d.created_at), { addSuffix: true, locale: dateLocale })}</span>
            </div>
            <p className="text-sm font-mono leading-relaxed">{d.draft_text}</p>
            {d.tweet && <p className="text-xs text-muted-foreground mt-2">{t("drafts.re")} <span dir="ltr">@{d.tweet.source_handle}</span> — “{d.tweet.text?.slice(0, 80)}…”</p>}
          </Card>
        ))}
      </div>
    </>
  );
}
