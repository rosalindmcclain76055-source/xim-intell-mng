import { TopBar } from "@/components/app/TopBar";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

export default function AuditLogs() {
  const { currentWorkspace } = useWorkspace();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (!currentWorkspace) return;
    supabase.from("audit_logs").select("*").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false }).limit(100).then(({ data }) => setItems(data ?? []));
  }, [currentWorkspace]);
  return (
    <>
      <TopBar title="Audit Logs" subtitle="Every event in this workspace" />
      <div className="p-6 animate-fade-in">
        <Card className="p-0 overflow-hidden">
          {items.length === 0 ? <div className="p-12 text-center text-sm text-muted-foreground">No events.</div>
            : <div className="divide-y divide-border">
              {items.map((a) => (
                <div key={a.id} className="px-5 py-3 grid grid-cols-12 gap-3 items-center hover:bg-surface-2 transition-colors">
                  <span className="col-span-3 font-mono text-xs text-primary truncate">{a.event_type}</span>
                  <span className="col-span-2 text-xs text-muted-foreground truncate">{a.entity_type ?? "—"}</span>
                  <span className="col-span-5 text-sm truncate">{a.summary}</span>
                  <span className="col-span-2 text-[11px] text-muted-foreground text-right">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                </div>
              ))}
            </div>}
        </Card>
      </div>
    </>
  );
}
