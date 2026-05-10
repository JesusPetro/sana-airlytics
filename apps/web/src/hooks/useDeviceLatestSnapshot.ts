import { useQuery } from '@tanstack/react-query';
import { getDatastreams } from '@/lib/api/analytics';
import { getDeviceSnapshot, type Snapshot } from '@/lib/api/devices';

export function useDeviceLatestSnapshot(deviceId: string, workspaceId: string | undefined) {
  const dsQuery = useQuery({
    queryKey:  ['datastreams', workspaceId],
    queryFn:   () => getDatastreams(workspaceId!),
    enabled:   !!workspaceId,
    staleTime: 10 * 60 * 1000,
    gcTime:    20 * 60 * 1000,
  });

  // Find the latest phenomenon_time_end among this device's datastreams
  const lastRecordedAt = (dsQuery.data ?? [])
    .filter((ds) => ds.sensor_id === deviceId)
    .map((ds) => ds.phenomenon_time_end)
    .filter((t): t is string => t !== null)
    .sort()
    .at(-1) ?? null;

  return useQuery<Snapshot>({
    queryKey: ['device-latest-snapshot', deviceId, lastRecordedAt],
    queryFn:  () => getDeviceSnapshot(deviceId, lastRecordedAt!),
    enabled:  !!lastRecordedAt,
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  });
}
