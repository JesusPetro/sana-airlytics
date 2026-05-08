'use client';

import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useDevices } from '@/hooks/useDevices';
import { useDashboard } from '@/hooks/useDashboard';
import { useTimeRange, rangeToISO } from '@/hooks/useTimeRange';
import { DeviceRow } from './DeviceRow';
import type { DeviceStatusResponse } from '@/types/sensor';

interface DevicesTableProps {
  onSelectDevice: (device: DeviceStatusResponse) => void;
  onClaimDevice: () => void;
}

const HEADERS = ['', 'devices.colName', 'devices.colModel', 'devices.colLastSeen', 'devices.colPm25', ''];

export function DevicesTable({ onSelectDevice, onClaimDevice }: DevicesTableProps) {
  const t = useTranslations();
  const { activeWorkspace } = useWorkspace();
  const { range } = useTimeRange();
  const { from, to } = rangeToISO(range);

  const { data: devices = [], isLoading } = useDevices(activeWorkspace?.workspace_id);
  const { data: dashData } = useDashboard(activeWorkspace?.workspace_id, from, to);

  function pm2_5ForDevice(device: DeviceStatusResponse): number | null {
    const entry = dashData['pm2_5'];
    if (!entry) return null;
    if (entry.datastream.sensor_code !== device.code) return null;
    return entry.latestValue;
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
            {t('devices.title')}
          </span>
          {!isLoading && (
            <span style={{
              marginLeft: '8px',
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
              background: 'var(--color-surface-subtle)',
              borderRadius: '9999px',
              padding: '1px 8px',
            }}>
              {devices.length}
            </span>
          )}
        </div>
        <button
          onClick={onClaimDevice}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '7px 14px',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-dark)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-primary)')}
        >
          + {t('devices.claimDevice')}
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-subtle)' }}>
              {HEADERS.map((h, i) => (
                <th key={i} style={{
                  padding: '10px 16px',
                  textAlign: i === HEADERS.length - 1 ? 'right' : 'left',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}>
                  {h ? t(h as Parameters<typeof t>[0]) : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={6} style={{
                  padding: '40px',
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
                  pm2_5={pm2_5ForDevice(d)}
                  onClick={onSelectDevice}
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
      {[40, 160, 120, 100, 80, 60].map((w, i) => (
        <td key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{
            height: '12px',
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
