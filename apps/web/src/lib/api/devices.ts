import { apiClient } from './client';
import type { DeviceStatusResponse } from '@/types/sensor';

export function getDevices(wsId: string): Promise<DeviceStatusResponse[]> {
  return apiClient<DeviceStatusResponse[]>(`/api/v1/workspaces/${wsId}/devices`);
}

export interface TrackPoint {
  latitude: number;
  longitude: number;
  elevation: number | null;
  recorded_at: string;
  contaminant_value: number | null;
}

export function getDeviceTrack(
  deviceId: string,
  from: string,
  to: string,
  contaminant?: string,
): Promise<TrackPoint[]> {
  const params = new URLSearchParams({ from, to });
  if (contaminant) params.set('contaminant', contaminant);
  return apiClient<TrackPoint[]>(`/api/v1/sensors/${deviceId}/track?${params}`);
}

export interface SnapshotVariable {
  property_code: string;
  property_name: string;
  result: number | null;
  unit_symbol: string;
  qualifier: string | null;
}

export interface Snapshot {
  sensor_id: string;
  phenomenon_time: string;
  variables: SnapshotVariable[];
}

export function getDeviceSnapshot(deviceId: string, at: string): Promise<Snapshot> {
  const params = new URLSearchParams({ at });
  return apiClient<Snapshot>(`/api/v1/sensors/${deviceId}/snapshot?${params}`);
}

export function findDeviceByCode(code: string): Promise<DeviceStatusResponse> {
  return apiClient<DeviceStatusResponse>(`/api/v1/devices?code=${encodeURIComponent(code)}`);
}

export function claimDevice(deviceId: string, workspaceId: string): Promise<void> {
  return apiClient<void>(`/api/v1/devices/${deviceId}/claim`, {
    method: 'POST',
    body: JSON.stringify({ workspace_id: workspaceId }),
  });
}
