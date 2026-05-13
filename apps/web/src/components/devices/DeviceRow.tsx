'use client';

import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { formatRelative } from '@/lib/format';
import type { DeviceStatusResponse } from '@/types/sensor';

interface DeviceRowProps {
  device:               DeviceStatusResponse;
  samplingInterval?:    number;
  transmissionInterval?: number;
  lastSeenFallback?:    string | null;
  isSelected:           boolean;
  onClick:              (device: DeviceStatusResponse) => void;
  onClose:              () => void;
}

const STATUS_COLOR = {
  ACTIVE:   'var(--color-status-online)',
  PENDING:  'var(--color-status-pending)',
  INACTIVE: 'var(--color-status-offline)',
} as const;

const STATUS_LABEL = {
  ACTIVE:   'Online',
  PENDING:  'Pending',
  INACTIVE: 'Offline',
} as const;

function fmtSeconds(s: number): string {
  return s >= 60 ? `${Math.round(s / 60)}m` : `${s}s`;
}

export function DeviceRow({ device, samplingInterval, transmissionInterval, lastSeenFallback, isSelected, onClick, onClose }: DeviceRowProps) {
  const t  = useTranslations('devices');
  const tc = useTranslations('common');
  const locale = useLocale();
  const statusColor = STATUS_COLOR[device.status] ?? 'var(--color-text-disabled)';

  const closeBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '6px',
    background: 'var(--color-primary-surface)',
    border: '1px solid color-mix(in oklab, var(--color-primary) 30%, transparent)',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'background 140ms',
  };

  const detailsBtnStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--color-primary)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px 10px',
    borderRadius: '6px',
    transition: 'background 140ms',
  };

  return (
    <tr
      onClick={() => onClick(device)}
      style={{
        cursor: 'pointer',
        background: isSelected ? 'var(--color-primary-surface)' : 'transparent',
        transition: 'background 120ms',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'var(--color-surface-subtle)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isSelected ? 'var(--color-primary-surface)' : 'transparent';
      }}
    >
      {/* Status */}
      <td style={td}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
          <span style={{
            width: '8px', height: '8px',
            borderRadius: '50%',
            background: statusColor,
            flexShrink: 0,
            position: 'relative',
          }}>
            {device.status === 'ACTIVE' && (
              <span style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                background: statusColor,
                opacity: 0.3,
                animation: 'sensorPulseAnim 2s ease-out infinite',
              }} />
            )}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 500, color: statusColor }}>
            {STATUS_LABEL[device.status]}
          </span>
        </div>
      </td>

      {/* Name + code */}
      <td style={td}>
        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
          {device.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
          {device.code}
        </div>
      </td>

      {/* Model */}
      <td style={{ ...td, color: 'var(--color-text-secondary)', fontSize: '12px' }}>
        {device.model}
      </td>

      {/* Last seen */}
      <td style={{ ...td, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
        {(device.last_seen ?? lastSeenFallback)
          ? formatRelative((device.last_seen ?? lastSeenFallback)!, locale)
          : <span style={{ color: 'var(--color-text-disabled)' }}>{t('never')}</span>}
      </td>

      {/* Sampling */}
      <td style={{ ...td, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
        {samplingInterval != null ? fmtSeconds(samplingInterval) : '—'}
      </td>

      {/* Transmission */}
      <td style={{ ...td, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
        {transmissionInterval != null ? fmtSeconds(transmissionInterval) : '—'}
      </td>

      {/* Action */}
      <td style={{ ...td, textAlign: 'right' }}>
        {isSelected ? (
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={closeBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--color-primary) 18%, transparent)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-primary-surface)')}
          >
            <X size={12} />
            {tc('close')}
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onClick(device); }}
            style={detailsBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-surface)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            {t('details')}
          </button>
        )}
      </td>
    </tr>
  );
}

const td: React.CSSProperties = {
  padding: '13px 16px',
  verticalAlign: 'middle',
  borderBottom: '1px solid var(--color-border-subtle)',
};
