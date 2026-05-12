import { useMemo } from 'react';
import { useQueries, keepPreviousData } from '@tanstack/react-query';
import { getObservations, getAggregations } from '@/lib/api/analytics';
import type {
  AggregationBucketResponse,
  ChartPoint,
  ObservationPointResponse,
} from '@/types/analytics';

export type BucketOption = '5m' | '15m' | '30m' | '1h' | '6h' | '1d' | 'raw';

export const BUCKET_DAYS: Record<BucketOption, number> = {
  raw:   2,
  '5m':  2,
  '15m': 7,
  '30m': 7,
  '1h':  30,
  '6h':  90,
  '1d':  90,
};

const STALE_TIME = 270 * 1000;
const GC_TIME    = 600 * 1000;

function floorToMinute(d: Date) {
  d.setSeconds(0, 0);
  return d;
}

function defaultWindow(bucket: BucketOption) {
  const to   = floorToMinute(new Date());
  const from = new Date(to);
  from.setDate(from.getDate() - BUCKET_DAYS[bucket]);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function useTimeSeries(
  workspaceId:   string | undefined,
  datastreamIds: string[],
  bucket:        BucketOption,
  explicitFrom?: string,
  explicitTo?:   string,
): { data: Record<string, ChartPoint[]>; isLoading: boolean; isFetching: boolean } {
  const defaultW = useMemo(() => defaultWindow(bucket), [bucket]);

  const from = explicitFrom ?? defaultW.from;
  const to   = explicitTo   ?? defaultW.to;

  const isRaw = bucket === 'raw';

  const queries = useQueries({
    queries: datastreamIds.map((dsId) => ({
      queryKey:        ['timeseries', workspaceId, dsId, bucket, from, to],
      queryFn:         isRaw
        ? () => getObservations(workspaceId!, dsId, from, to)
        : () => getAggregations(workspaceId!, dsId, from, to, bucket),
      enabled:         !!workspaceId && !!dsId,
      staleTime:       0,
      gcTime:          GC_TIME,
      placeholderData: keepPreviousData,
      refetchInterval: 10_000,
    })),
  });

  const data = useMemo<Record<string, ChartPoint[]>>(() => {
    const result: Record<string, ChartPoint[]> = {};
    datastreamIds.forEach((dsId, idx) => {
      const rows = queries[idx]?.data ?? [];
      if (isRaw) {
        result[dsId] = (rows as ObservationPointResponse[]).map((r) => ({
          time:  r.phenomenon_time,
          value: r.result,
        }));
      } else {
        result[dsId] = (rows as AggregationBucketResponse[]).map((r) => ({
          time:  r.bucket,
          value: r.avg_value,
        }));
      }
    });
    return result;
  }, [queries, isRaw, datastreamIds]);

  return {
    data,
    isLoading:  queries.length > 0 && queries.every((q) => q.isLoading && !q.isPlaceholderData),
    isFetching: queries.some((q) => q.isFetching),
  };
}
