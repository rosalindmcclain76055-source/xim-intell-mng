import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/app/TopBar";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, AtSign, Hash, Brain, Search } from "lucide-react";
import { toast } from "sonner";

const TYPE_META: Record<string, { icon: any; label: string; color: string }> = {
  account: { icon: AtSign, label: "Account", color: "text-primary" },
  keyword: { icon: Hash, label: "Keyword", color: "text-accent" },
  concept: { icon: Brain, label: "Concept", color: "text-warning" },
  query: { icon: Search, label: "Query", color: "text-success" },
};

export default function Sources() {
  const { currentWorkspace, role } = useWorkspace();
  const canEdit = role === "admin" || role === "editor";
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"account" | "keyword" | "concept" | "query">("account");
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const [priority, setPriority] = useState(50);

  const load = useCallback(async () => {
    if (!currentWorkspace) return;
    const { data } = await supabase.from("watch_sources").select("*").eq("workspace_id", currentWorkspace.id).order("priority", { ascending: false });
    setRows(data ?? []);
  }, [currentWorkspace]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!currentWorkspace || !value.trim()) return;
    const { error } = await supabase.from("watch_sources").insert({
      workspace_id: currentWorkspace.id,
      source_type: type,
      source_value: value.trim(),
      label: label.trim() || null,
      priority,
      enabled: true,
    });
    if (error) toast.error(error.message);
    else { toast.success("Source added"); setOpen(false); setValue(""); setLabel(""); load(); }
  };

  const toggle = async (id: string, enabled: boolean) => {
    await supabase.from("watch_sources").update({ enabled }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("watch_sources").delete().eq("id", id);
    toast.success("Removed");
    load();
  };

  return (
    <>
      <TopBar
        title="Sources"
        subtitle="Watchlists of accounts, keywords, concepts, and queries"
        actions={canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add source</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Add watch source</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account">Account (handle)</SelectItem>
                      <SelectItem value="keyword">Keyword</SelectItem>
                      <SelectItem value="concept">Concept</SelectItem>
                      <SelectItem value="query">X-style query</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Value</Label>
                  <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "account" ? "VitalikButerin" : type === "query" ? "from:OpenAI gpt -filter:replies" : "stablecoin depeg"} />
                </div>
                <div className="space-y-1.5">
                  <Label>Label (optional)</Label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Friendly name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Priority: <span className="font-mono">{priority}</span></Label>
                  <input type="range" min={0} max={100} value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="w-full" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={add}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />
      <div className="p-6 animate-fade-in">
        <Card className="p-0 overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-muted-foreground">No sources yet. Add accounts, keywords, or queries to monitor.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((r) => {
                const meta = TYPE_META[r.source_type];
                return (
                  <div key={r.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-surface-2 transition-colors">
                    <meta.icon className={`w-4 h-4 ${meta.color} shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm truncate">{r.source_value}</span>
                        {r.label && <span className="text-xs text-muted-foreground truncate">· {r.label}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{meta.label}</Badge>
                        <span className="text-[11px] text-muted-foreground font-mono">priority {r.priority}</span>
                      </div>
                    </div>
                    <Switch checked={r.enabled} onCheckedChange={(v) => toggle(r.id, v)} disabled={!canEdit} />
                    {canEdit && (
                      <Button variant="ghost" size="icon" onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
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
