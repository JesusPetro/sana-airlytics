'use client';

import { useTranslations } from 'next-intl';
import { DeviceRow } from './DeviceRow';
import type { DeviceStatusResponse } from '@/types/sensor';
import type { DashboardEntry } from '@/hooks/useDashboard';

interface DevicesTableProps {
  devices:          DeviceStatusResponse[];
  dashData:         Record<string, DashboardEntry>;
  isLoading:        boolean;
  onSelectDevice:   (device: DeviceStatusResponse) => void;
  onCloseDevice:    () => void;
  selectedDeviceId: string | null;
}

function latestBucketForDevice(dashData: Record<string, DashboardEntry>, deviceId: string): string | null {
  let latest: string | null = null;
  for (const e of Object.values(dashData)) {
    if (e.datastream.sensor_id !== deviceId) continue;
    for (const b of e.buckets) {
      if (b.avg_value !== null && (latest === null || b.bucket > latest)) {
        latest = b.bucket;
      }
    }
  }
  return latest;
}

const HEADERS = ['devices.colStatus', 'devices.colName', 'devices.colModel', 'devices.colLastSeen', 'devices.colSampling', 'devices.colTransmission', ''];

const thStyle: React.CSSProperties = {
  padding: '11px 16px',
  fontWeight: 600,
  fontSize: '12px',
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid var(--color-border-subtle)',
};

export function DevicesTable({ devices, dashData, isLoading, onSelectDevice, onCloseDevice, selectedDeviceId }: DevicesTableProps) {
  const t = useTranslations();

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-subtle)' }}>
              {HEADERS.map((h, i) => (
                <th key={i} style={{
                  ...thStyle,
                  textAlign: i === HEADERS.length - 1 ? 'right' : 'left',
                }}>
                  {h ? t(h as Parameters<typeof t>[0]) : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={6} style={{
                  padding: '60px 40px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  fontSize: '13px',
                }}>
                  {t('devices.noDevices')}
                </td>
              </tr>
            ) : (
              devices.map((d) => (
                <DeviceRow
                  key={d.device_id}
                  device={d}
                  samplingInterval={d.sampling_interval_seconds}
                  transmissionInterval={d.transmission_interval_seconds}
                  lastSeenFallback={latestBucketForDevice(dashData, d.device_id)}
                  isSelected={d.device_id === selectedDeviceId}
                  onClick={onSelectDevice}
                  onClose={onCloseDevice}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[32, 180, 100, 110, 70, 70, 60].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{
            height: '11px',
            width: `${w}px`,
            borderRadius: '6px',
            background: 'var(--color-surface-2)',
            animation: 'skelPulse 1.5s ease-in-out infinite',
          }} />
        </td>
      ))}
    </tr>
  );
}
