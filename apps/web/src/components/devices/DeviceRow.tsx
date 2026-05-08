'use client';

import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { StatusDot } from '@/components/ui/StatusDot';
import { formatRelative } from '@/lib/format';
import { levelFromValue } from '@/lib/aqi';
import type { DeviceStatusResponse } from '@/types/sensor';

interface DeviceRowProps {
  device: DeviceStatusResponse;
  pm2_5?: number | null;
  onClick: (device: DeviceStatusResponse) => void;
}

export function DeviceRow({ device, pm2_5, onClick }: DeviceRowProps) {
  const t = useTranslations('devices');
  const locale = useLocale();

  const pm2_5Level = pm2_5 != null ? levelFromValue('pm2_5', pm2_5) : null;

  return (
    <tr
      onClick={() => onClick(device)}
      style={{ cursor: 'pointer' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Status */}
      <td style={tdStyle}>
        <StatusDot status={device.status} />
      </td>

      {/* Name + code */}
      <td style={tdStyle}>
        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>
          {device.name}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
          {device.code}
        </div>
      </td>

      {/* Model */}
      <td style={{ ...tdStyle, color: 'var(--color-text-secondary)', fontSize: '12px' }}>
        {device.model}
      </td>

      {/* Last seen */}
      <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
        {device.last_seen
          ? formatRelative(device.last_seen, locale)
          : <span style={{ color: 'var(--color-text-disabled)' }}>{t('never')}</span>}
      </td>

      {/* PM2.5 */}
      <td style={tdStyle}>
        {pm2_5 != null ? (
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: pm2_5Level?.color ?? 'var(--color-text-primary)',
          }}>
            {pm2_5.toFixed(1)} µg/m³
          </span>
        ) : (
          <span style={{ color: 'var(--color-text-disabled)', fontSize: '12px' }}>—</span>
        )}
      </td>

      {/* Action */}
      <td style={{ ...tdStyle, textAlign: 'right' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onClick(device); }}
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--color-primary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-surface)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          {t('details')}
        </button>
      </td>
    </tr>
  );
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  verticalAlign: 'middle',
  borderBottom: '1px solid var(--color-border-subtle)',
};
