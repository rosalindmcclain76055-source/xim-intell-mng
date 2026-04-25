import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, switchWorkspace, createWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between font-medium bg-sidebar-accent/50 border-sidebar-border">
            <span className="truncate">{currentWorkspace?.name ?? t("workspace.select")}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="start">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5">{t("workspace.workspaces")}</div>
          {workspaces.map((w) => (
            <button
              key={w.id}
              onClick={() => { switchWorkspace(w.id); setOpen(false); }}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground"
            >
              <span className="truncate">{w.name}</span>
              <Check className={cn("h-3.5 w-3.5", currentWorkspace?.id === w.id ? "opacity-100" : "opacity-0")} />
            </button>
          ))}
          <div className="h-px bg-border my-1" />
          <button
            onClick={() => { setOpen(false); setCreateOpen(true); }}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> {t("workspace.newWorkspace")}
          </button>
        </PopoverContent>
      </Popover>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{t("workspace.createTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ws-name">{t("common.name")}</Label>
            <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("workspace.namePlaceholder")} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t("common.cancel")}</Button>
            <Button
              onClick={async () => {
                if (!name.trim()) return;
                const ws = await createWorkspace(name.trim());
                if (ws) {
                  toast.success(t("workspace.created"));
                  setName("");
                  setCreateOpen(false);
                  await switchWorkspace(ws.id);
                } else {
                  toast.error(t("workspace.createFailed"));
                }
              }}
            >
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
