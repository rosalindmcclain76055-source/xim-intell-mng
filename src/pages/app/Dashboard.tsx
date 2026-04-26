import { useEffect, useState } from "react";
import { TopBar } from "@/components/app/TopBar";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox, Radar, GitBranch, Send, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { faIR, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useTweets } from "@/hooks/useTweets";
import { toast } from "sonner";

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
  const { tweets, loading, ingest } = useTweets();

  const [stats, setStats] = useState<Stats>({ ingestedToday: 0, relevant: 0, pendingDrafts: 0, publishedToday: 0 });
  const [audits, setAudits] = useState<any[]>([]);
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    if (!currentWorkspace) return;
    const wsId = currentWorkspace.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    (async () => {
      const [ing, rel, pen, pub, auditRows] = await Promise.all([
        supabase.from("tweets").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).gte("ingested_at", todayIso),
        supabase.from("classifications").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).neq("final_decision", "ignore"),
        supabase.from("drafts").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).eq("status", "pending"),
        supabase.from("drafts").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).eq("status", "published"),
        supabase.from("audit_logs").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }).limit(6),
      ]);

      setStats({
        ingestedToday: ing.count ?? 0,
        relevant: rel.count ?? 0,
        pendingDrafts: pen.count ?? 0,
        publishedToday: pub.count ?? 0,
      });
      setAudits(auditRows.data ?? []);
    })();
  }, [currentWorkspace, tweets.length]);

  const cards = [
    { label: t("dashboard.ingestedToday"), value: stats.ingestedToday, icon: Radar, color: "text-primary" },
    { label: t("dashboard.relevantTweets"), value: stats.relevant, icon: GitBranch, color: "text-accent" },
    { label: t("dashboard.pendingDrafts"), value: stats.pendingDrafts, icon: Inbox, color: "text-warning" },
    { label: t("dashboard.publishedCount"), value: stats.publishedToday, icon: Send, color: "text-success" },
  ];

  return (
    <>
      <TopBar
        title={t("nav.dashboard")}
        subtitle={currentWorkspace?.name}
        actions={
          <Button
            size="sm"
            onClick={async () => {
              setIngesting(true);
              try {
                await ingest();
                toast.success("Tweets ingested");
              } catch (e: any) {
                toast.error(e?.message ?? "Ingestion failed");
              } finally {
                setIngesting(false);
              }
            }}
            disabled={ingesting || !currentWorkspace}
            className="gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {ingesting ? "Ingesting…" : "Ingest Tweets"}
          </Button>
        }
      />
      <div className="p-6 space-y-6 animate-fade-in">
        {!loading && tweets.length === 0 && (
          <Card className="p-5 border-dashed bg-surface-2 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h3 className="font-display font-semibold">{t("dashboard.emptyTitle")}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">No tweets found yet. Click "Ingest Tweets" to load your pipeline data.</p>
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
                <p className="text-xs text-muted-foreground">Latest tweets from Supabase</p>
              </div>
              <Link to="/app/queue" className="text-xs text-primary hover:underline flex items-center gap-1">
                {t("common.viewQueue")} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {!loading && tweets.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No tweets yet.</div>}
              {tweets.slice(0, 6).map((tweet) => (
                <div key={tweet.id} className="px-5 py-4 hover:bg-surface-2 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground text-sm" dir="ltr">
                        @{tweet.author_handle}
                      </span>
                      {tweet.classifications?.[0] && (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-mono">
                          {tweet.classifications[0].final_decision}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(tweet.created_at), { addSuffix: true, locale: dateLocale })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-2">{tweet.text}</p>
                  {tweet.classifications?.[0] && (
                    <div className="mt-1 text-[11px] text-muted-foreground font-mono">
                      score: {tweet.classifications[0].final_score.toFixed(2)}
                    </div>
                  )}
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
              {audits.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">{t("dashboard.noEvents")}</div>}
              {audits.map((a) => (
                <div key={a.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-[11px] text-primary" dir="ltr">
                      {a.event_type}
                    </span>
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
