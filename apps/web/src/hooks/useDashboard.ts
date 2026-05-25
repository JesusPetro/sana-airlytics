import { useQuery, useQueries } from '@tanstack/react-query';
import { getDatastreams, getAggregations } from '@/lib/api/analytics';
import { KPI_SPECS_THRESH, KPI_SPECS_NOTHRESH } from '@/lib/constants';
import type { AggregationBucketResponse, DatastreamResponse } from '@/types/analytics';

const ALL_CODES = [
  ...KPI_SPECS_THRESH.map((s) => s.code),
  ...KPI_SPECS_NOTHRESH.map((s) => s.code),
];

export interface DashboardEntry {
  datastream:   DatastreamResponse;
  buckets:      AggregationBucketResponse[];
  latestValue:  number | null;
  lastDayDate:  string | null;
}

const REFETCH_INTERVAL = 10_000;

function kpiWindow() {
  const to = new Date();
  to.setSeconds(0, 0); // floor al minuto para estabilizar el queryKey
  const from = new Date(to);
  from.setDate(from.getDate() - 90);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function useDashboard(workspaceId: string | undefined, sensorId?: string) {
  const { from, to } = kpiWindow(); // sin useMemo: recalcula en cada refetch para que `to` avance

  const dsQuery = useQuery({
    queryKey:        ['datastreams', workspaceId],
    queryFn:         () => getDatastreams(workspaceId!),
    enabled:         !!workspaceId,
    staleTime:       0,
    gcTime:          5 * 60 * 1000,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnMount:  'always',
  });

  const datastreams: DatastreamResponse[] = dsQuery.data ?? [];

  const aggQueries = useQueries({
    queries: ALL_CODES.map((code) => {
      const ds = datastreams.find((d) =>
        d.property_code.toLowerCase() === code && (!sensorId || d.sensor_id === sensorId),
      );
      return {
        queryKey:        ['kpi', workspaceId, sensorId ?? 'any', ds?.datastream_id ?? code, from],
        queryFn:         () => getAggregations(workspaceId!, ds!.datastream_id, from, to, '1d'),
        enabled:         !!workspaceId && !!ds,
        staleTime:       0,
        gcTime:          10 * 60 * 1000,
        refetchInterval: REFETCH_INTERVAL,
      };
    }),
  });

  const result: Record<string, DashboardEntry> = {};
  ALL_CODES.forEach((code, idx) => {
    const ds = datastreams.find((d) =>
      d.property_code.toLowerCase() === code && (!sensorId || d.sensor_id === sensorId),
    );
    if (!ds) return;
    const buckets: AggregationBucketResponse[] = (aggQueries[idx]?.data as AggregationBucketResponse[] | undefined) ?? [];
    const withData = buckets.filter((b) => b.avg_value !== null);
    const lastDay  = withData.at(-1) ?? null;
    result[code] = {
      datastream:  ds,
      buckets,
      latestValue: lastDay?.avg_value ?? null,
      lastDayDate: lastDay?.bucket     ?? null,
    };
  });

  // isPending (not isLoading) — in React Query v5, isLoading is false for a
  // query that is pending but not yet fetching (e.g. the tick between enabled
  // flipping true and the first fetch starting). Using isPending prevents the
  // "no sensors" guard from firing prematurely on that brief intermediate state.
  const dsIsLoading  = dsQuery.isPending || (dsQuery.isFetching && !dsQuery.data?.length);
  const aggIsLoading = aggQueries.some((q) => q.isPending);
  const isLoading    = dsIsLoading || aggIsLoading;

  return { data: result, isLoading, dsIsLoading, datastreams };
}
