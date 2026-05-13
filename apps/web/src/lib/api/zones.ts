import { apiClient } from './client';
import type {
  ZoneResponse,
  CreateZoneRequest,
  UpdateZoneRequest,
  ZoneHealthResponse,
} from '@/types/analytics';

export function getZones(wsId: string): Promise<ZoneResponse[]> {
  return apiClient<ZoneResponse[]>(`/api/v1/workspaces/${wsId}/zones`);
}

export function createZone(wsId: string, body: CreateZoneRequest): Promise<ZoneResponse> {
  return apiClient<ZoneResponse>(`/api/v1/workspaces/${wsId}/zones`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateZone(wsId: string, zoneId: string, body: UpdateZoneRequest): Promise<void> {
  return apiClient<void>(`/api/v1/workspaces/${wsId}/zones/${zoneId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteZone(wsId: string, zoneId: string): Promise<void> {
  return apiClient<void>(`/api/v1/workspaces/${wsId}/zones/${zoneId}`, {
    method: 'DELETE',
  });
}

export function getZoneHealth(
  zoneId: string,
  fromDt: string,
  toDt: string,
): Promise<ZoneHealthResponse> {
  return apiClient<ZoneHealthResponse>(
    `/api/v1/zones/${zoneId}/health?from=${encodeURIComponent(fromDt)}&to=${encodeURIComponent(toDt)}`,
  );
}
