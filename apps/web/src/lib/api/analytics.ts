import { apiClient } from './client';
import type {
  DatastreamResponse,
  ObservationPointResponse,
  AggregationBucketResponse,
  AlertEventResponse,
  AlertRuleResponse,
} from '@/types/analytics';

export function getDatastreams(wsId: string): Promise<DatastreamResponse[]> {
  return apiClient<DatastreamResponse[]>(`/api/v1/workspaces/${wsId}/datastreams`);
}

export function getObservations(
  wsId: string,
  dsId: string,
  from: string,
  to: string,
): Promise<ObservationPointResponse[]> {
  const params = new URLSearchParams({ from, to });
  return apiClient<ObservationPointResponse[]>(
    `/api/v1/workspaces/${wsId}/datastreams/${dsId}/observations?${params}`,
  );
}

export function getAggregations(
  wsId: string,
  dsId: string,
  from: string,
  to: string,
  bucket?: string,
): Promise<AggregationBucketResponse[]> {
  const params = new URLSearchParams({ from, to });
  if (bucket) params.set('bucket', bucket);
  return apiClient<AggregationBucketResponse[]>(
    `/api/v1/workspaces/${wsId}/datastreams/${dsId}/aggregations?${params}`,
  );
}

export function getAlertEvents(
  wsId: string,
  from?: string,
  to?: string,
): Promise<AlertEventResponse[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to)   params.set('to', to);
  const qs = params.size ? `?${params}` : '';
  return apiClient<AlertEventResponse[]>(`/api/v1/workspaces/${wsId}/alert-events${qs}`);
}

export function getAlertRules(wsId: string): Promise<AlertRuleResponse[]> {
  return apiClient<AlertRuleResponse[]>(`/api/v1/workspaces/${wsId}/alert-rules`);
}
