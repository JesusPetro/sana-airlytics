'use client';

import { createContext, useContext, type ReactNode } from 'react';

interface WorkspaceContextValue {
  workspaceId: string;
  workspaceName: string;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const DEFAULT_WORKSPACE: WorkspaceContextValue = {
  workspaceId: 'ws-001',
  workspaceName: 'Cartagena Centro',
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  return (
    <WorkspaceContext.Provider value={DEFAULT_WORKSPACE}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
