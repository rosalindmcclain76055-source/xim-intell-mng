import { Moon, Sun, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { seedWorkspace } from "@/lib/seed";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currentWorkspace, role, refresh } = useWorkspace();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="flex items-center justify-between px-6 py-3.5 gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-lg font-semibold leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {actions}
          {currentWorkspace && role && (
            <Badge variant="outline" className="hidden sm:inline-flex font-mono text-[10px] uppercase tracking-wider">
              {role}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={seeding}
            onClick={async () => {
              if (!currentWorkspace) return;
              setSeeding(true);
              try {
                await seedWorkspace(currentWorkspace.id);
                await refresh();
                toast.success(t("topbar.seedSuccess"));
              } catch (e: any) {
                toast.error(e?.message ?? t("topbar.seedFailed"));
              } finally {
                setSeeding(false);
              }
            }}
            className="hidden sm:inline-flex gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {seeding ? t("topbar.seeding") : t("topbar.seedDemo")}
          </Button>
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t("common.theme")}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="font-mono text-xs">
                {user?.email?.split("@")[0]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground truncate">
                {user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/app/settings")}>{t("common.settings")}</DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  toast.success(t("auth.signedOut"));
                  navigate("/auth");
                }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" /> {t("common.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
