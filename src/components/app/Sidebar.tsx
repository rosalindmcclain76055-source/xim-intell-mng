import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Radar, ListFilter, Inbox, FileEdit, Send,
  BarChart3, ScrollText, Settings, Users, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { useTranslation } from "react-i18next";

const navItems = [
  { to: "/app", key: "dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/sources", key: "sources", icon: Radar },
  { to: "/app/watchlists", key: "watchlists", icon: ListFilter },
  { to: "/app/queue", key: "queue", icon: Inbox },
  { to: "/app/drafts", key: "drafts", icon: FileEdit },
  { to: "/app/published", key: "published", icon: Send },
  { to: "/app/personas", key: "personas", icon: Sparkles },
  { to: "/app/accounts", key: "accounts", icon: Users },
  { to: "/app/analytics", key: "analytics", icon: BarChart3 },
  { to: "/app/audit", key: "audit", icon: ScrollText },
  { to: "/app/settings", key: "settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-screen sticky top-0">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-primary shadow-glow flex items-center justify-center font-display font-bold text-primary-foreground">
            X
          </div>
          <div>
            <div className="font-display font-semibold leading-tight">{t("brand.name")}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("brand.tagline")}</div>
          </div>
        </div>
      </div>
      <div className="px-3 pb-3">
        <WorkspaceSwitcher />
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        {navItems.map((item) => {
          const active = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="w-4 h-4" />
              {t(`nav.${item.key}`)}
            </NavLink>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-sidebar-border text-[11px] text-muted-foreground">
        {t("brand.footer")}
      </div>
    </aside>
  );
}
