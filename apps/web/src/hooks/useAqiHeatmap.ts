import { useQuery } from '@tanstack/react-query';
import { getAggregations } from '@/lib/api/analytics';

function heatmapWindow() {
  const to = new Date();
  to.setSeconds(0, 0);
  const from = new Date(to);
  from.setDate(from.getDate() - 7);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function useAqiHeatmap(
  workspaceId: string | undefined,
  datastreamId: string | undefined,
) {
  const { from, to } = heatmapWindow();

  return useQuery({
    queryKey:  ['heatmap', workspaceId, datastreamId, from],
    queryFn:   () => getAggregations(workspaceId!, datastreamId!, from, to, '1h'),
    enabled:   !!workspaceId && !!datastreamId,
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  });
}
