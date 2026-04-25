import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/app/TopBar";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/app/ScoreBar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { GenerateDraftButton } from "@/components/app/GenerateDraftButton";
import { ClassifyButton } from "@/components/app/ClassifyButton";

export default function Watchlists() {
  const { currentWorkspace, role } = useWorkspace();
  const canEdit = role === "admin" || role === "editor";
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

  const filtered = tweets.filter((t) => {
    const c = t.classifications?.[0];
    if (decision !== "all" && c?.final_decision !== decision) return false;
    if (search && !t.text.toLowerCase().includes(search.toLowerCase()) && !t.source_handle.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <TopBar
        title="Tweet Stream"
        subtitle={`${tweets.length} ingested · classifier scores per tweet`}
      />
      <div className="p-6 animate-fade-in space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search text or handle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Tabs value={decision} onValueChange={setDecision}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft_reply">Replies</TabsTrigger>
              <TabsTrigger value="draft_quote">Quotes</TabsTrigger>
              <TabsTrigger value="draft_post">Posts</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
              <TabsTrigger value="ignore">Ignored</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="p-0 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No tweets match.</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((t) => {
                const c = t.classifications?.[0];
                return (
                  <div key={t.id} className="px-5 py-4 hover:bg-surface-2 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{t.source_display_name}</span>
                        <span className="text-muted-foreground font-mono">@{t.source_handle}</span>
                        {c && <DecisionBadge decision={c.final_decision} />}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(t.ingested_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed mb-2">{t.text}</p>
                    {c && (
                      <div className="grid grid-cols-4 gap-3 mt-2">
                        <ScoreBar label="Topic" value={c.topic_score} />
                        <ScoreBar label="Source" value={c.source_score} />
                        <ScoreBar label="Action" value={c.actionability_score} />
                        <ScoreBar label="Risk" value={c.risk_score} variant="risk" />
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
                          <ClassifyButton tweetId={t.id} onClassified={load} />
                          <GenerateDraftButton tweetId={t.id} onGenerated={load} />
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
  const map: Record<string, string> = {
    ignore: "bg-muted text-muted-foreground",
    review: "bg-warning/15 text-warning border-warning/30",
    draft_reply: "bg-primary/15 text-primary border-primary/30",
    draft_quote: "bg-accent/15 text-accent border-accent/30",
    draft_post: "bg-success/15 text-success border-success/30",
  };
  return <Badge variant="outline" className={`text-[10px] font-mono uppercase tracking-wider ${map[decision] ?? ""}`}>{decision.replace("_", " ")}</Badge>;
}
