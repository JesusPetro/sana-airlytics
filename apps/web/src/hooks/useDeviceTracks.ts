import { useQueries } from '@tanstack/react-query';
import { getDeviceTrack, type TrackPoint } from '@/lib/api/devices';
import type { DeviceStatusResponse } from '@/types/sensor';

export interface DeviceTrack {
  device: DeviceStatusResponse;
  points: TrackPoint[];
}

// Rango fijo: muestra todas las ubicaciones registradas, sin depender del rango de mediciones
const TRACK_FROM = '2020-01-01T00:00:00.000Z';
const getTrackTo  = () => new Date(Date.now() + 86_400_000).toISOString();

export function useDeviceTracks(
  devices: DeviceStatusResponse[],
  contaminant?: string,
): DeviceTrack[] {
  const results = useQueries({
    queries: devices.map((d) => ({
      queryKey: ['device-track', d.device_id, contaminant],
      queryFn: () => getDeviceTrack(d.device_id, TRACK_FROM, getTrackTo(), contaminant),
      staleTime: 2 * 60 * 1000,
      gcTime:   10 * 60 * 1000,
    })),
  });

  return devices.map((device, i) => ({
    device,
    points: results[i]?.data ?? [],
  }));
}
