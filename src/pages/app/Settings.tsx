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
import { useTranslation } from "react-i18next";

export default function Settings() {
  const { user } = useAuth();
  const { currentWorkspace, role } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  return (
    <>
      <TopBar title={t("settings.title")} />
      <div className="p-6 space-y-4 max-w-2xl animate-fade-in">
        <Card className="p-5">
          <h3 className="font-display font-semibold mb-3">{t("settings.account")}</h3>
          <div className="space-y-3">
            <div><Label className="text-xs">{t("common.email")}</Label><Input value={user?.email ?? ""} readOnly /></div>
            <div><Label className="text-xs">{t("common.workspace")}</Label><Input value={currentWorkspace?.name ?? ""} readOnly /></div>
            <div><Label className="text-xs">{t("common.role")}</Label><div><Badge variant="outline" className="font-mono uppercase text-[10px]">{role}</Badge></div></div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold mb-3">{t("settings.appearance")}</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("common.theme")}: <span className="font-mono text-foreground">{theme}</span></span>
            <Button variant="outline" size="sm" onClick={toggleTheme}>{t("common.toggle")}</Button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold mb-3">{t("settings.language")}</h3>
          <div className="flex gap-2">
            <Button
              variant={i18n.language === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => i18n.changeLanguage("en")}
            >
              English
            </Button>
            <Button
              variant={i18n.language === "fa" ? "default" : "outline"}
              size="sm"
              onClick={() => i18n.changeLanguage("fa")}
            >
              فارسی
            </Button>
          </div>
        </Card>

        <Card className="p-5 border-warning/30 bg-warning/5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display font-semibold">{t("settings.safetyTitle")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("settings.safetyDesc")}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
