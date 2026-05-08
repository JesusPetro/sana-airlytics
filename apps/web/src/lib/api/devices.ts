import { apiClient } from './client';
import type { DeviceStatusResponse } from '@/types/sensor';

export function getDevices(wsId: string): Promise<DeviceStatusResponse[]> {
  return apiClient<DeviceStatusResponse[]>(`/api/v1/workspaces/${wsId}/devices`);
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
