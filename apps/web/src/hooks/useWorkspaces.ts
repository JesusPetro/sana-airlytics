import { useQuery } from '@tanstack/react-query';
import { getWorkspaces } from '@/lib/api/workspaces';

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn:  getWorkspaces,
    staleTime: 5 * 60 * 1000,
    gcTime:    15 * 60 * 1000,
  });
}
