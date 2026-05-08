import { useQueries } from '@tanstack/react-query';
import { getAggregations } from '@/lib/api/analytics';
import type { AggregationBucketResponse } from '@/types/analytics';

export function useTimeSeries(
  workspaceId: string | undefined,
  datastreamIds: string[],
  from: string,
  to: string,
) {
  const queries = useQueries({
    queries: datastreamIds.map((dsId) => ({
      queryKey:  ['timeseries', workspaceId, dsId, from, to],
      queryFn:   () => getAggregations(workspaceId!, dsId, from, to, '1h'),
      enabled:   !!workspaceId && !!dsId,
      staleTime: 4 * 60 * 1000 + 30 * 1000,
      gcTime:    10 * 60 * 1000,
    })),
  });

  const data: Record<string, AggregationBucketResponse[]> = {};
  datastreamIds.forEach((dsId, idx) => {
    data[dsId] = queries[idx]?.data ?? [];
  });

  const isLoading = queries.some((q) => q.isLoading);

  return { data, isLoading };
}
