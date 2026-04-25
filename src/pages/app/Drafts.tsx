import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/app/TopBar";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Drafts() {
  const { currentWorkspace } = useWorkspace();
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
      <TopBar title="Drafts" subtitle="All AI-generated drafts across statuses" actions={
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
          </TabsList>
        </Tabs>
      } />
      <div className="p-6 animate-fade-in space-y-3">
        {items.length === 0 ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">No drafts.</Card>
        ) : items.map((d) => (
          <Card key={d.id} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-mono">{d.action_type}</Badge>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-mono">{d.status}</Badge>
              <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}</span>
            </div>
            <p className="text-sm font-mono leading-relaxed">{d.draft_text}</p>
            {d.tweet && <p className="text-xs text-muted-foreground mt-2">Re: @{d.tweet.source_handle} — “{d.tweet.text?.slice(0, 80)}…”</p>}
          </Card>
        ))}
      </div>
    </>
  );
}
