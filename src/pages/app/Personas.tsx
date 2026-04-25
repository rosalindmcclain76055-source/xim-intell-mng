import { TopBar } from "@/components/app/TopBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useCallback } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Personas() {
  const { currentWorkspace, role } = useWorkspace();
  const canEdit = role === "admin" || role === "editor";
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", tone: "", expertise_domain: "", reply_style: "", risk_tolerance: "medium", description: "" });

  const load = useCallback(async () => {
    if (!currentWorkspace) return;
    const { data } = await supabase.from("persona_profiles").select("*").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  }, [currentWorkspace]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!currentWorkspace || !form.name.trim()) return;
    const { error } = await supabase.from("persona_profiles").insert({ ...form, workspace_id: currentWorkspace.id });
    if (error) toast.error(error.message);
    else { toast.success("Persona created"); setOpen(false); setForm({ name: "", tone: "", expertise_domain: "", reply_style: "", risk_tolerance: "medium", description: "" }); load(); }
  };

  return (
    <>
      <TopBar title="Personas" subtitle="Voice profiles for each connected account" actions={canEdit && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New persona</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Create persona</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {(["name","tone","expertise_domain","reply_style","risk_tolerance"] as const).map((k) => (
                <div key={k} className="space-y-1.5">
                  <Label className="capitalize">{k.replace("_", " ")}</Label>
                  <Input value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )} />
      <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
        {items.length === 0 ? <Card className="p-12 text-center text-sm text-muted-foreground col-span-full">No personas yet.</Card>
          : items.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-md bg-gradient-primary/20 border border-primary/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-display font-semibold">{p.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{p.description}</p>
              <div className="space-y-1.5 text-xs">
                {p.tone && <Row label="Tone" value={p.tone} />}
                {p.expertise_domain && <Row label="Expertise" value={p.expertise_domain} />}
                {p.reply_style && <Row label="Style" value={p.reply_style} />}
                {p.risk_tolerance && <div className="flex items-center justify-between"><span className="text-muted-foreground">Risk</span><Badge variant="outline" className="text-[10px] font-mono uppercase">{p.risk_tolerance}</Badge></div>}
              </div>
            </Card>
          ))}
      </div>
    </>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3"><span className="text-muted-foreground shrink-0">{label}</span><span className="text-right">{value}</span></div>;
}
