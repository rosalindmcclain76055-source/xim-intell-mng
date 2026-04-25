import { TopBar } from "@/components/app/TopBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useState, useCallback } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { AtSign, Plus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function Accounts() {
  const { currentWorkspace, role } = useWorkspace();
  const canEdit = role === "admin" || role === "editor";
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ handle: "", display_name: "", bio: "" });

  const load = useCallback(async () => {
    if (!currentWorkspace) return;
    const { data } = await supabase.from("connected_accounts").select("*, persona:persona_profiles(name)").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  }, [currentWorkspace]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!currentWorkspace || !form.handle.trim()) return;
    const { error } = await supabase.from("connected_accounts").insert({ ...form, workspace_id: currentWorkspace.id, enabled: true, auto_reply_enabled: false });
    if (error) toast.error(error.message);
    else { toast.success("Account added"); setOpen(false); setForm({ handle: "", display_name: "", bio: "" }); load(); }
  };

  const toggle = async (id: string, field: "enabled" | "auto_reply_enabled", v: boolean) => {
    await supabase.from("connected_accounts").update({ [field]: v }).eq("id", id);
    load();
  };

  return (
    <>
      <TopBar title="Connected Accounts" subtitle="X accounts being managed" actions={canEdit && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add account</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Add account</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Handle</Label><Input value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} placeholder="cryptoanalyst" /></div>
              <div className="space-y-1.5"><Label>Display name</Label><Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Bio</Label><Input value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )} />
      <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
        {items.length === 0 ? <Card className="p-12 text-center text-sm text-muted-foreground col-span-full">No accounts.</Card>
          : items.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-md bg-gradient-primary/20 border border-primary/30 flex items-center justify-center"><AtSign className="w-4 h-4 text-primary" /></div>
                <div className="min-w-0">
                  <div className="font-display font-semibold leading-tight truncate">{a.display_name || a.handle}</div>
                  <div className="text-xs font-mono text-muted-foreground truncate">@{a.handle}</div>
                </div>
              </div>
              {a.bio && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{a.bio}</p>}
              {a.persona?.name && <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-mono mb-3">{a.persona.name}</Badge>}
              <div className="space-y-2 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs"><span>Enabled</span><Switch disabled={!canEdit} checked={a.enabled} onCheckedChange={(v) => toggle(a.id, "enabled", v)} /></div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-warning" /> Auto-reply</span>
                  <Switch disabled={!canEdit} checked={a.auto_reply_enabled} onCheckedChange={(v) => toggle(a.id, "auto_reply_enabled", v)} />
                </div>
              </div>
            </Card>
          ))}
      </div>
    </>
  );
}
