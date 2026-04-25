import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
}

export type Role = "admin" | "editor" | "viewer";

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  role: Role | null;
  loading: boolean;
  switchWorkspace: (id: string) => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace | null>;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: members } = await supabase
      .from("workspace_members")
      .select("role, workspace:workspaces(id, name, owner_id)")
      .eq("user_id", user.id);

    const ws: Workspace[] = (members ?? [])
      .map((m: any) => m.workspace)
      .filter(Boolean);
    setWorkspaces(ws);

    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .maybeSingle();

    const currentId = profile?.current_workspace_id ?? ws[0]?.id ?? null;
    const current = ws.find((w) => w.id === currentId) ?? ws[0] ?? null;
    setCurrentWorkspace(current);

    if (current) {
      const member = (members ?? []).find((m: any) => m.workspace?.id === current.id);
      setRole((member?.role as Role) ?? "viewer");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const switchWorkspace = async (id: string) => {
    const ws = workspaces.find((w) => w.id === id);
    if (!ws || !user) return;
    setCurrentWorkspace(ws);
    await supabase.from("profiles").update({ current_workspace_id: id }).eq("id", user.id);
    await refresh();
  };

  const createWorkspace = async (name: string): Promise<Workspace | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name, owner_id: user.id })
      .select()
      .single();
    if (error || !data) return null;
    await supabase.from("workspace_members").insert({
      workspace_id: data.id,
      user_id: user.id,
      role: "admin",
    });
    await refresh();
    return data;
  };

  return (
    <WorkspaceContext.Provider value={{ workspaces, currentWorkspace, role, loading, switchWorkspace, createWorkspace, refresh }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
};
