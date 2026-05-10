import { useQuery, useQueries } from '@tanstack/react-query';
import { getDatastreams, getAggregations } from '@/lib/api/analytics';
import { KPI_SPECS_THRESH, KPI_SPECS_NOTHRESH } from '@/lib/constants';
import type { AggregationBucketResponse, DatastreamResponse } from '@/types/analytics';

const ALL_CODES = [
  ...KPI_SPECS_THRESH.map((s) => s.code),
  ...KPI_SPECS_NOTHRESH.map((s) => s.code),
];

export interface DashboardEntry {
  datastream: DatastreamResponse;
  buckets: AggregationBucketResponse[];
  latestValue: number | null;
}

export function useDashboard(
  workspaceId: string | undefined,
  from: string,
  to: string,
) {
  const dsQuery = useQuery({
    queryKey:  ['datastreams', workspaceId],
    queryFn:   () => getDatastreams(workspaceId!),
    enabled:   !!workspaceId,
    staleTime: 10 * 60 * 1000,
    gcTime:    20 * 60 * 1000,
  });

  const datastreams: DatastreamResponse[] = dsQuery.data ?? [];

  const aggQueries = useQueries({
    queries: ALL_CODES.map((code) => {
      const ds = datastreams.find((d) => d.property_code.toLowerCase() === code);
      return {
        queryKey:  ['aggregations', workspaceId, ds?.datastream_id ?? code, from, to],
        queryFn:   () => getAggregations(workspaceId!, ds!.datastream_id, from, to),
        enabled:   !!workspaceId && !!ds,
        staleTime: 4 * 60 * 1000 + 30 * 1000,
        gcTime:    10 * 60 * 1000,
      };
    }),
  });

  const result: Record<string, DashboardEntry> = {};
  ALL_CODES.forEach((code, idx) => {
    const ds = datastreams.find((d) => d.property_code.toLowerCase() === code);
    if (!ds) return;
    const buckets: AggregationBucketResponse[] = (aggQueries[idx]?.data as AggregationBucketResponse[] | undefined) ?? [];
    const last = [...buckets].reverse().find((b) => b.avg_value !== null);
    result[code] = {
      datastream:  ds,
      buckets,
      latestValue: last?.avg_value ?? null,
    };
  });

  // isFetching covers the case where dsQuery finishes but re-fetches in background
  const dsIsLoading  = dsQuery.isLoading || dsQuery.isFetching;
  const aggIsLoading = aggQueries.some((q) => q.isLoading);
  const isLoading    = dsIsLoading || aggIsLoading;

  return { data: result, isLoading, dsIsLoading };
}
