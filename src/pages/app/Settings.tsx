import { TopBar } from "@/components/app/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ShieldAlert } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { currentWorkspace, role } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  return (
    <>
      <TopBar title="Settings" />
      <div className="p-6 space-y-4 max-w-2xl animate-fade-in">
        <Card className="p-5">
          <h3 className="font-display font-semibold mb-3">Account</h3>
          <div className="space-y-3">
            <div><Label className="text-xs">Email</Label><Input value={user?.email ?? ""} readOnly /></div>
            <div><Label className="text-xs">Workspace</Label><Input value={currentWorkspace?.name ?? ""} readOnly /></div>
            <div><Label className="text-xs">Role</Label><div><Badge variant="outline" className="font-mono uppercase text-[10px]">{role}</Badge></div></div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold mb-3">Appearance</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme: <span className="font-mono text-foreground">{theme}</span></span>
            <Button variant="outline" size="sm" onClick={toggleTheme}>Toggle</Button>
          </div>
        </Card>

        <Card className="p-5 border-warning/30 bg-warning/5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display font-semibold">Safety policy</h3>
              <p className="text-sm text-muted-foreground mt-1">
                XIM never auto-publishes replies or mentions. All interactive drafts require human approval.
                Auto-reply per account is opt-in and disabled by default.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
