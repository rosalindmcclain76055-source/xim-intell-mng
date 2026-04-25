import { TopBar } from "@/components/app/TopBar";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function Published() {
  const { currentWorkspace } = useWorkspace();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (!currentWorkspace) return;
    supabase.from("drafts").select("*, tweet:tweets(source_handle)").eq("workspace_id", currentWorkspace.id).eq("status", "published").order("published_at", { ascending: false }).then(({ data }) => setItems(data ?? []));
  }, [currentWorkspace]);
  return (
    <>
      <TopBar title="Published" subtitle="Posts successfully published" />
      <div className="p-6 space-y-3 animate-fade-in">
        {items.length === 0 ? <Card className="p-12 text-center text-sm text-muted-foreground">Nothing published yet.</Card>
          : items.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-[10px] font-mono uppercase">{d.action_type}</Badge>
                <span className="text-[11px] text-muted-foreground">{d.published_at && formatDistanceToNow(new Date(d.published_at), { addSuffix: true })}</span>
              </div>
              <p className="text-sm font-mono leading-relaxed">{d.draft_text}</p>
            </Card>
          ))}
      </div>
    </>
  );
}
