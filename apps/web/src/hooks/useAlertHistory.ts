import { useQuery } from '@tanstack/react-query';
import { getAlertEvents } from '@/lib/api/analytics';

export function useAlertHistory(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['alert-events', workspaceId],
    queryFn:  () => getAlertEvents(workspaceId!),
    enabled:  !!workspaceId,
    staleTime: 3 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  });
}
