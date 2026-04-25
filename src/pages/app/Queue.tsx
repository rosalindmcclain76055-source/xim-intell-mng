import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/app/TopBar";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScoreBar } from "@/components/app/ScoreBar";
import { Check, X, Edit3, Inbox } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { faIR, enUS } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

export default function Queue() {
  const { currentWorkspace, role } = useWorkspace();
  const canEdit = role === "admin" || role === "editor";
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "fa" ? faIR : enUS;
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const load = useCallback(async () => {
    if (!currentWorkspace) return;
    let q = supabase
      .from("drafts")
      .select("*, tweet:tweets(text, source_handle, source_display_name, ingested_at), classification:classifications!inner(topic_score, source_score, actionability_score, risk_score, matched_keywords)")
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at", { ascending: false });
    if (filter === "pending") q = q.eq("status", "pending");
    const { data } = await q;
    setItems(data ?? []);
  }, [currentWorkspace, filter]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: "approved" | "rejected" | "pending" | "scheduled" | "published" | "failed") => {
    const update: any = { status };
    if (status === "approved") update.approved_by = (await supabase.auth.getUser()).data.user?.id;
    const { error } = await supabase.from("drafts").update(update).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(t("queue.markedToast", { status: t(`common.${status}`, { defaultValue: status }) })); load(); }
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from("drafts").update({ draft_text: editText }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(t("queue.updated")); setEditing(null); load(); }
  };

  return (
    <>
      <TopBar
        title={t("queue.title")}
        subtitle={t("queue.subtitle")}
        actions={
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="pending">{t("common.pending")}</TabsTrigger>
              <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />
      <div className="p-6 animate-fade-in space-y-4">
        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <Inbox className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{t("queue.empty")}</p>
          </Card>
        ) : items.map((d) => (
          <Card key={d.id} className="p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-mono">{d.action_type}</Badge>
                  <StatusBadge status={d.status} />
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(d.created_at), { addSuffix: true, locale: dateLocale })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("queue.re")} <span className="font-mono" dir="ltr">@{d.tweet?.source_handle}</span> — “{d.tweet?.text?.slice(0, 100)}…”
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 rounded-md bg-surface-2 border border-border">
              <ScoreBar label={t("scores.topic")} value={d.classification?.topic_score ?? 0} />
              <ScoreBar label={t("scores.source")} value={d.classification?.source_score ?? 0} />
              <ScoreBar label={t("scores.action")} value={d.classification?.actionability_score ?? 0} />
              <ScoreBar label={t("scores.risk")} value={d.classification?.risk_score ?? 0} variant="risk" />
            </div>

            {editing === d.id ? (
              <div className="space-y-2">
                <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(null)}>{t("common.cancel")}</Button>
                  <Button size="sm" onClick={() => saveEdit(d.id)}>{t("common.save")}</Button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-md border border-border bg-card text-sm leading-relaxed font-mono">
                {d.draft_text}
              </div>
            )}

            {canEdit && d.status === "pending" && editing !== d.id && (
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => { setEditing(d.id); setEditText(d.draft_text); }}>
                  <Edit3 className="w-3.5 h-3.5 mr-1" /> {t("common.edit")}
                </Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => setStatus(d.id, "rejected")}>
                  <X className="w-3.5 h-3.5 mr-1" /> {t("common.reject")}
                </Button>
                <Button size="sm" onClick={() => setStatus(d.id, "approved")}>
                  <Check className="w-3.5 h-3.5 mr-1" /> {t("common.approve")}
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning border-warning/30",
    approved: "bg-primary/15 text-primary border-primary/30",
    rejected: "bg-destructive/15 text-destructive border-destructive/30",
    scheduled: "bg-accent/15 text-accent border-accent/30",
    published: "bg-success/15 text-success border-success/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <Badge variant="outline" className={`text-[10px] font-mono uppercase tracking-wider ${map[status] ?? ""}`}>
      {t(`common.${status}`, { defaultValue: status })}
    </Badge>
  );
}
