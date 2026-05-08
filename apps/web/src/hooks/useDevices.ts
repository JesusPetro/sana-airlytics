import { useQuery } from '@tanstack/react-query';
import { getDevices } from '@/lib/api/devices';

export function useDevices(workspaceId: string | undefined) {
  return useQuery({
    queryKey:  ['devices', workspaceId],
    queryFn:   () => getDevices(workspaceId!),
    enabled:   !!workspaceId,
    staleTime: 2 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  });
}
