'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRef, type ReactNode } from 'react';
import { WorkspaceProvider, useWorkspace } from '@/context/WorkspaceContext';
import { AuthProvider } from '@/context/AuthContext';
import { MobileNavProvider } from '@/context/MobileNavContext';
import { useAlertNotifier } from '@/hooks/useAlertNotifier';

function AlertNotifierMount() {
  const { activeWorkspace } = useWorkspace();
  useAlertNotifier(activeWorkspace?.workspace_id);
  return null;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Sensor readings arrive at minimum every 5 min — stay slightly under that
        staleTime: 4 * 60 * 1000 + 30 * 1000, // 4m 30s
        gcTime:    10 * 60 * 1000,              // 10m
        retry: 1,
        refetchOnWindowFocus: true,
      },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  // useRef so the QueryClient is not recreated on every render
  const clientRef = useRef<QueryClient | null>(null);
  if (!clientRef.current) clientRef.current = makeQueryClient();

  return (
    <QueryClientProvider client={clientRef.current}>
      <AuthProvider>
        <WorkspaceProvider>
          <MobileNavProvider>
            <AlertNotifierMount />
            {children}
          </MobileNavProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
