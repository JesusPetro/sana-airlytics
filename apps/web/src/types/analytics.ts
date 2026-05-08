export interface DatastreamResponse {
  datastream_id: string;
  name: string;
  sensor_id: string;
  sensor_code: string;
  sensor_name: string;
  property_code: string;
  property_name: string;
  unit_code: string;
  unit_symbol: string;
  status: string;
  phenomenon_time_start: string | null;
  phenomenon_time_end: string | null;
}

export interface ObservationPointResponse {
  phenomenon_time: string;
  result: number;
  qualifier: string | null;
}

export interface AggregationBucketResponse {
  bucket: string;
  avg_value: number | null;
  min_value: number | null;
  max_value: number | null;
  sample_count: number;
}

export interface AlertEventResponse {
  event_id: string;
  alert_rule_id: string;
  triggered_at: string;
  resolved_at: string | null;
  value: number;
  message: string;
}

export interface AlertRuleResponse {
  rule_id: string;
  workspace_id: string;
  name: string;
  metric: string;
  operator: string;
  threshold: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface HeatmapPointResponse {
  latitude: number;
  longitude: number;
  avg_value: number;
}
