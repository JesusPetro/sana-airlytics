import { useQuery } from '@tanstack/react-query';
import { getDeviceSnapshot, type Snapshot } from '@/lib/api/devices';

export function useDeviceLatestSnapshot(deviceId: string, workspaceId: string | undefined) {
  return useQuery<Snapshot>({
    queryKey:  ['device-latest-snapshot', deviceId],
    queryFn:   () => getDeviceSnapshot(deviceId),
    enabled:   !!deviceId && !!workspaceId,
    staleTime:      30 * 1000,
    gcTime:         5 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });
}
