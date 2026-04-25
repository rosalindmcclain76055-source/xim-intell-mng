import { useEffect, useState } from "react";
import { TopBar } from "@/components/app/TopBar";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox, Radar, GitBranch, Send, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { faIR, enUS } from "date-fns/locale";
import { ScoreBar } from "@/components/app/ScoreBar";
import { useTranslation, Trans } from "react-i18next";

interface Stats {
  ingestedToday: number;
  relevant: number;
  pendingDrafts: number;
  publishedToday: number;
}

export default function Dashboard() {
  const { currentWorkspace } = useWorkspace();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "fa" ? faIR : enUS;
  const [stats, setStats] = useState<Stats>({ ingestedToday: 0, relevant: 0, pendingDrafts: 0, publishedToday: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);

  useEffect(() => {
    if (!currentWorkspace) return;
    const wsId = currentWorkspace.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    (async () => {
      const [ing, rel, pen, pub, recentRows, auditRows] = await Promise.all([
        supabase.from("tweets").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).gte("ingested_at", todayIso),
        supabase.from("classifications").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).neq("final_decision", "ignore"),
        supabase.from("drafts").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).eq("status", "pending"),
        supabase.from("drafts").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).eq("status", "published"),
        supabase
          .from("classifications")
          .select("*, tweet:tweets(text, source_handle, source_display_name, ingested_at)")
          .eq("workspace_id", wsId)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("audit_logs")
          .select("*")
          .eq("workspace_id", wsId)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      setStats({
        ingestedToday: ing.count ?? 0,
        relevant: rel.count ?? 0,
        pendingDrafts: pen.count ?? 0,
        publishedToday: pub.count ?? 0,
      });
      setRecent(recentRows.data ?? []);
      setAudits(auditRows.data ?? []);
    })();
  }, [currentWorkspace]);

  const cards = [
    { label: t("dashboard.ingestedToday"), value: stats.ingestedToday, icon: Radar, color: "text-primary" },
    { label: t("dashboard.relevantTweets"), value: stats.relevant, icon: GitBranch, color: "text-accent" },
    { label: t("dashboard.pendingDrafts"), value: stats.pendingDrafts, icon: Inbox, color: "text-warning" },
    { label: t("dashboard.publishedCount"), value: stats.publishedToday, icon: Send, color: "text-success" },
  ];

  return (
    <>
      <TopBar title={t("nav.dashboard")} subtitle={currentWorkspace?.name} />
      <div className="p-6 space-y-6 animate-fade-in">
        {stats.ingestedToday === 0 && stats.pendingDrafts === 0 && (
          <Card className="p-5 border-dashed bg-surface-2 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h3 className="font-display font-semibold">{t("dashboard.emptyTitle")}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                <Trans
                  i18nKey="dashboard.emptyDesc"
                  values={{ seed: t("topbar.seedDemo") }}
                  components={{ 1: <span className="font-mono text-foreground" /> }}
                />
              </p>
            </div>
          </Card>
        )}

        <div className="stat-grid">
          {cards.map((c) => (
            <Card key={c.label} className="p-5 hover:shadow-elev-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">{c.label}</div>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div className="font-display text-3xl font-semibold">{c.value}</div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold">{t("dashboard.recentTitle")}</h3>
                <p className="text-xs text-muted-foreground">{t("dashboard.recentDesc")}</p>
              </div>
              <Link to="/app/queue" className="text-xs text-primary hover:underline flex items-center gap-1">
                {t("common.viewQueue")} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recent.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">{t("dashboard.noClassifications")}</div>
              )}
              {recent.map((c) => (
                <div key={c.id} className="px-5 py-4 hover:bg-surface-2 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-muted-foreground" dir="ltr">@{c.tweet?.source_handle}</span>
                      <DecisionBadge decision={c.final_decision} />
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {c.tweet?.ingested_at && formatDistanceToNow(new Date(c.tweet.ingested_at), { addSuffix: true, locale: dateLocale })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-2 mb-2">{c.tweet?.text}</p>
                  <div className="grid grid-cols-4 gap-2 text-[10px]">
                    <ScoreBar label={t("scores.topic")} value={c.topic_score} />
                    <ScoreBar label={t("scores.source")} value={c.source_score} />
                    <ScoreBar label={t("scores.action")} value={c.actionability_score} />
                    <ScoreBar label={t("scores.risk")} value={c.risk_score} variant="risk" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-display font-semibold">{t("dashboard.auditTitle")}</h3>
              <Link to="/app/audit" className="text-xs text-primary hover:underline flex items-center gap-1">
                {t("common.viewAll")} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {audits.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">{t("dashboard.noEvents")}</div>
              )}
              {audits.map((a) => (
                <div key={a.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-[11px] text-primary" dir="ltr">{a.event_type}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: dateLocale })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.summary}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const { t } = useTranslation();
  const classes: Record<string, string> = {
    ignore: "bg-muted text-muted-foreground",
    review: "bg-warning/15 text-warning border-warning/30",
    draft_reply: "bg-primary/15 text-primary border-primary/30",
    draft_quote: "bg-accent/15 text-accent border-accent/30",
    draft_post: "bg-success/15 text-success border-success/30",
  };
  return (
    <Badge variant="outline" className={`text-[10px] font-mono uppercase tracking-wider ${classes[decision] ?? ""}`}>
      {t(`decisions.${decision}`, { defaultValue: decision })}
    </Badge>
  );
}
