export type SensorStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE';

export interface DeviceStatusResponse {
  device_id: string;
  code: string;
  name: string;
  model: string;
  status: SensorStatus;
  sampling_interval_seconds: number;
  transmission_interval_seconds: number;
  keepalive_seconds: number;
  last_seen: string | null;
  site_type: string | null;
  latitude: number | null;
  longitude: number | null;
  elevation: number | null;
}
