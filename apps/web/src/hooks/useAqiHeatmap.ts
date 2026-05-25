import { useQuery } from '@tanstack/react-query';
import { getAggregations } from '@/lib/api/analytics';

function heatmapWindow(weekOffset: number) {
  const to = new Date();
  to.setSeconds(0, 0);
  to.setDate(to.getDate() + weekOffset * 7);
  const from = new Date(to);
  from.setDate(from.getDate() - 7);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function useAqiHeatmap(
  workspaceId:  string | undefined,
  datastreamId: string | undefined,
  weekOffset:   number = 0,
) {
  const { from, to } = heatmapWindow(weekOffset);

  return useQuery({
    queryKey:        ['heatmap', workspaceId, datastreamId, from],
    queryFn:         () => getAggregations(workspaceId!, datastreamId!, from, to, '1h'),
    enabled:         !!workspaceId && !!datastreamId,
    staleTime:       0,
    gcTime:          10 * 60 * 1000,
    refetchInterval: weekOffset === 0 ? 10_000 : false,
  });
}
