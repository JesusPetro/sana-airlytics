'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRef, type ReactNode } from 'react';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { AuthProvider } from '@/context/AuthContext';

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
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
