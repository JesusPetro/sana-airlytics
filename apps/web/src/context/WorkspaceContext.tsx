'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { WorkspaceSummary } from '@/types/workspace';
import { getWorkspaces } from '@/lib/api/workspaces';
import { useAuth } from './AuthContext';

interface WorkspaceContextValue {
  workspaces: WorkspaceSummary[];
  activeWorkspace: WorkspaceSummary | null;
  setActiveWorkspace: (ws: WorkspaceSummary) => void;
  refreshWorkspaces: () => Promise<WorkspaceSummary[] | null>;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (): Promise<WorkspaceSummary[] | null> => {
    try {
      const list = await getWorkspaces();
      setWorkspaces(list);
      setActiveWorkspace((prev) => {
        if (prev && list.find((w) => w.workspace_id === prev.workspace_id)) return prev;
        return list[0] ?? null;
      });
      return list;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // me() uses skipAuthRedirect — redirect manually when session is gone
      if (typeof window !== 'undefined') {
        const locale = window.location.pathname.split('/')[1] ?? 'es';
        window.location.href = `/${locale}/login`;
      }
      return;
    }
    load().finally(() => setIsLoading(false));
  }, [authLoading, user, load]);

  const refreshWorkspaces = useCallback(async (): Promise<WorkspaceSummary[] | null> => {
    return load();
  }, [load]);

  return (
    <WorkspaceContext.Provider
      value={{ workspaces, activeWorkspace, setActiveWorkspace, refreshWorkspaces, isLoading }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
