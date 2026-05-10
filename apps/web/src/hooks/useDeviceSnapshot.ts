import { useQuery } from '@tanstack/react-query';
import { getDeviceSnapshot, type Snapshot } from '@/lib/api/devices';

export function useDeviceSnapshot(deviceId: string) {
  return useQuery<Snapshot>({
    queryKey: ['device-snapshot', deviceId],
    queryFn: () => getDeviceSnapshot(deviceId, new Date().toISOString()),
    staleTime: 0,
    gcTime: 60_000,
    retry: 1,
  });
}
