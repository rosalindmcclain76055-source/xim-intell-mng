import { TopBar } from "@/components/app/TopBar";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export default function Analytics() {
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const [stats, setStats] = useState({ tweets: 0, relevant: 0, drafts: 0, approved: 0, published: 0, ignored: 0 });
  const [topSources, setTopSources] = useState<{ handle: string; count: number }[]>([]);
  const [topKeywords, setTopKeywords] = useState<{ kw: string; count: number }[]>([]);

  useEffect(() => {
    if (!currentWorkspace) return;
    const wsId = currentWorkspace.id;
    (async () => {
      const [tw, cls, drafts] = await Promise.all([
        supabase.from("tweets").select("source_handle").eq("workspace_id", wsId),
        supabase.from("classifications").select("final_decision, matched_keywords").eq("workspace_id", wsId),
        supabase.from("drafts").select("status").eq("workspace_id", wsId),
      ]);
      const sourceMap = new Map<string, number>();
      tw.data?.forEach((t) => sourceMap.set(t.source_handle, (sourceMap.get(t.source_handle) ?? 0) + 1));
      const kwMap = new Map<string, number>();
      cls.data?.forEach((c: any) => (c.matched_keywords ?? []).forEach((k: string) => kwMap.set(k, (kwMap.get(k) ?? 0) + 1)));
      setTopSources([...sourceMap.entries()].map(([handle, count]) => ({ handle, count })).sort((a, b) => b.count - a.count).slice(0, 6));
      setTopKeywords([...kwMap.entries()].map(([kw, count]) => ({ kw, count })).sort((a, b) => b.count - a.count).slice(0, 8));
      setStats({
        tweets: tw.data?.length ?? 0,
        relevant: cls.data?.filter((c) => c.final_decision !== "ignore").length ?? 0,
        ignored: cls.data?.filter((c) => c.final_decision === "ignore").length ?? 0,
        drafts: drafts.data?.length ?? 0,
        approved: drafts.data?.filter((d) => d.status === "approved").length ?? 0,
        published: drafts.data?.filter((d) => d.status === "published").length ?? 0,
      });
    })();
  }, [currentWorkspace]);

  const cards = [
    { label: t("analytics.cards.tweets"), value: stats.tweets },
    { label: t("analytics.cards.relevant"), value: stats.relevant },
    { label: t("analytics.cards.ignored"), value: stats.ignored },
    { label: t("analytics.cards.drafts"), value: stats.drafts },
    { label: t("analytics.cards.approved"), value: stats.approved },
    { label: t("analytics.cards.published"), value: stats.published },
  ];

  return (
    <>
      <TopBar title={t("analytics.title")} subtitle={t("analytics.subtitle")} />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {cards.map((c) => (
            <Card key={c.label} className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5">{c.label}</div>
              <div className="font-display text-2xl font-semibold">{c.value}</div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="font-display font-semibold mb-4">{t("analytics.topSources")}</h3>
            <div className="space-y-2">
              {topSources.length === 0 ? <p className="text-sm text-muted-foreground">{t("analytics.noData")}</p> : topSources.map((s) => {
                const max = topSources[0].count;
                return (
                  <div key={s.handle}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono" dir="ltr">@{s.handle}</span>
                      <span className="font-mono text-muted-foreground tabular-nums">{s.count}</span>
                    </div>
                    <div className="h-1.5 rounded bg-secondary overflow-hidden"><div className="h-full bg-gradient-primary" style={{ width: `${(s.count / max) * 100}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-display font-semibold mb-4">{t("analytics.topTopics")}</h3>
            <div className="flex flex-wrap gap-2">
              {topKeywords.length === 0 ? <p className="text-sm text-muted-foreground">{t("analytics.noData")}</p> : topKeywords.map((k) => (
                <span key={k.kw} className="px-2.5 py-1 rounded-md border border-border bg-surface-2 text-xs font-mono">
                  #{k.kw} <span className="text-muted-foreground">·{k.count}</span>
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
