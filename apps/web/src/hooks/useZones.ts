import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getZones, createZone, updateZone, deleteZone } from '@/lib/api/zones';
import type { CreateZoneRequest, UpdateZoneRequest } from '@/types/analytics';

export function useZones(workspaceId: string | undefined) {
  return useQuery({
    queryKey:  ['zones', workspaceId],
    queryFn:   () => getZones(workspaceId!),
    enabled:   !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateZone(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateZoneRequest) => createZone(workspaceId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones', workspaceId] }),
  });
}

export function useUpdateZone(workspaceId: string, zoneId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateZoneRequest) => updateZone(workspaceId, zoneId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones', workspaceId] }),
  });
}

export function useDeleteZone(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (zoneId: string) => deleteZone(workspaceId, zoneId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones', workspaceId] }),
  });
}
