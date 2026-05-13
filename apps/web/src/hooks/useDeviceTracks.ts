import { useQueries } from '@tanstack/react-query';
import { getDeviceTrack, type TrackPoint } from '@/lib/api/devices';
import type { DeviceStatusResponse } from '@/types/sensor';

export interface DeviceTrack {
  device: DeviceStatusResponse;
  points: TrackPoint[];
}

export function useDeviceTracks(
  devices: DeviceStatusResponse[],
  from: string,
  to: string,
  contaminant?: string,
): DeviceTrack[] {
  const results = useQueries({
    queries: devices.map((d) => ({
      queryKey: ['device-track', d.device_id, from, to, contaminant],
      queryFn: () => getDeviceTrack(d.device_id, from, to, contaminant),
      staleTime: 2 * 60 * 1000,
      gcTime:   10 * 60 * 1000,
    })),
  });

  return devices.map((device, i) => ({
    device,
    points: results[i]?.data ?? [],
  }));
}
