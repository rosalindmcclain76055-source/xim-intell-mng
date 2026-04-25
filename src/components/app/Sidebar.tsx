import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Radar, ListFilter, Inbox, FileEdit, Send,
  BarChart3, ScrollText, Settings, Users, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/sources", label: "Sources", icon: Radar },
  { to: "/app/watchlists", label: "Watchlists", icon: ListFilter },
  { to: "/app/queue", label: "Approval Queue", icon: Inbox },
  { to: "/app/drafts", label: "Drafts", icon: FileEdit },
  { to: "/app/published", label: "Published", icon: Send },
  { to: "/app/personas", label: "Personas", icon: Sparkles },
  { to: "/app/accounts", label: "Accounts", icon: Users },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/audit", label: "Audit Logs", icon: ScrollText },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-screen sticky top-0">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-primary shadow-glow flex items-center justify-center font-display font-bold text-primary-foreground">
            X
          </div>
          <div>
            <div className="font-display font-semibold leading-tight">XIM</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Intelligence Mgr</div>
          </div>
        </div>
      </div>
      <div className="px-3 pb-3">
        <WorkspaceSwitcher />
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        {nav.map((item) => {
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
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-sidebar-border text-[11px] text-muted-foreground">
        Human-approved automation
      </div>
    </aside>
  );
}
