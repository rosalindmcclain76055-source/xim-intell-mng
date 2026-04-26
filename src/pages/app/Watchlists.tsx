import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/app/TopBar";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/app/ScoreBar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { faIR, enUS } from "date-fns/locale";
import { GenerateDraftButton } from "@/components/app/GenerateDraftButton";
import { ClassifyButton } from "@/components/app/ClassifyButton";
import { useTranslation } from "react-i18next";

type ClassificationRow = Database["public"]["Tables"]["classifications"]["Row"];

export default function Watchlists() {
  const { currentWorkspace, role } = useWorkspace();
  const canEdit = role === "admin" || role === "editor";
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "fa" ? faIR : enUS;
  const [tweets, setTweets] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState<string>("all");

  const load = useCallback(async () => {
    if (!currentWorkspace) return;
    let q = supabase
      .from("tweets")
      .select("*, classifications(*)")
      .eq("workspace_id", currentWorkspace.id)
      .order("ingested_at", { ascending: false })
      .limit(50);
    const { data } = await q;
    setTweets(data ?? []);
  }, [currentWorkspace]);

  useEffect(() => { load(); }, [load]);

  const filtered = tweets.filter((tw) => {
    const c = tw.classifications?.[0];
    if (decision !== "all" && c?.final_decision !== decision) return false;
    if (search && !tw.text.toLowerCase().includes(search.toLowerCase()) && !tw.source_handle.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <TopBar
        title={t("watchlists.title")}
        subtitle={t("watchlists.subtitle", { count: tweets.length })}
      />
      <div className="p-6 animate-fade-in space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder={t("watchlists.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Tabs value={decision} onValueChange={setDecision}>
            <TabsList>
              <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
              <TabsTrigger value="draft">{t("decisions.draft")}</TabsTrigger>
              <TabsTrigger value="review">{t("watchlists.tabs.review")}</TabsTrigger>
              <TabsTrigger value="ignore">{t("watchlists.tabs.ignored")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="p-0 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">{t("watchlists.noMatch")}</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((tw) => {
                const c = tw.classifications?.[0];
                return (
                  <div key={tw.id} className="px-5 py-4 hover:bg-surface-2 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{tw.source_display_name}</span>
                        <span className="text-muted-foreground font-mono" dir="ltr">@{tw.source_handle}</span>
                        {c && <DecisionBadge decision={c.final_decision} />}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(tw.ingested_at), { addSuffix: true, locale: dateLocale })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed mb-2">{tw.text}</p>
                    {c && (
                      <div className="grid grid-cols-4 gap-3 mt-2">
                        <ScoreBar label={t("scores.topic")} value={c.topic_score} />
                        <ScoreBar label={t("scores.source")} value={c.source_score} />
                        <ScoreBar label={t("scores.action")} value={c.actionability_score} />
                        <ScoreBar label={t("scores.risk")} value={c.risk_score} variant="risk" />
                      </div>
                    )}
                    <div className="flex items-end justify-between mt-2 gap-3 flex-wrap">
                      <div className="flex flex-wrap gap-1 min-w-0">
                        {c?.matched_keywords?.length > 0 && c.matched_keywords.map((k: string) => (
                          <Badge key={k} variant="secondary" className="text-[10px] font-mono">#{k}</Badge>
                        ))}
                        {c?.reasoning && (
                          <span className="text-[11px] text-muted-foreground italic">{c.reasoning}</span>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <ClassifyButton
                            tweet={tw}
                            onClassified={(classification: ClassificationRow) => {
                              setTweets((prev) =>
                                prev.map((item) =>
                                  item.id === tw.id ? { ...item, classifications: [classification] } : item,
                                ),
                              );
                            }}
                          />
                          <GenerateDraftButton tweetId={tw.id} onGenerated={load} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const { t } = useTranslation();
  const classes: Record<string, string> = {
    ignore: "bg-muted text-muted-foreground",
    review: "bg-warning/15 text-warning border-warning/30",
    draft: "bg-primary/15 text-primary border-primary/30",
  };
  return (
    <Badge variant="outline" className={`text-[10px] font-mono uppercase tracking-wider ${classes[decision] ?? ""}`}>
      {t(`decisions.${decision}`, { defaultValue: decision })}
    </Badge>
  );
}
