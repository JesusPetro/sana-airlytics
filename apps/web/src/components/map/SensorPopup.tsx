'use client';

import { useTranslations } from 'next-intl';
import type { DeviceStatusResponse } from '@/types/sensor';
import { levelFromValue } from '@/lib/aqi';

interface Reading {
  pm2_5?: number | null;
  pm10?: number | null;
  co2?: number | null;
  nox_index?: number | null;
}

interface SensorPopupProps {
  device: DeviceStatusResponse;
  readings?: Reading;
  onClose: () => void;
}

function ReadingRow({ label, value, unit, code }: { label: string; value?: number | null; unit: string; code: string }) {
  const level = value != null ? levelFromValue(code, value) : null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: '12px', color: level?.color ?? 'var(--color-text-primary)' }}>
        {value != null ? `${value.toFixed(1)} ${unit}` : '—'}
      </span>
    </div>
  );
}

export function SensorPopup({ device, readings, onClose }: SensorPopupProps) {
  const t = useTranslations();

  const statusColor = {
    ACTIVE:   'var(--color-status-online)',
    INACTIVE: 'var(--color-status-offline)',
    PENDING:  'var(--color-status-pending)',
  }[device.status] ?? 'var(--color-status-offline)';

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '10px',
      boxShadow: 'var(--shadow-lg)',
      padding: '12px',
      minWidth: '180px',
      maxWidth: '220px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
            {device.name ?? device.code}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{device.status}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '0 0 0 8px', fontSize: '14px', lineHeight: 1 }} aria-label={t('common.close')}>
          ×
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <ReadingRow label="PM2.5" value={readings?.pm2_5}     unit="µg/m³" code="pm2_5" />
        <ReadingRow label="PM10"  value={readings?.pm10}      unit="µg/m³" code="pm10" />
        <ReadingRow label="CO₂"   value={readings?.co2}       unit="ppm"   code="co2" />
        <ReadingRow label="NOx"   value={readings?.nox_index} unit=""      code="nox_index" />
      </div>

      {device.site_type && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-border-subtle)', fontSize: '12px', color: 'var(--color-text-disabled)' }}>
          {device.site_type}
        </div>
      )}
    </div>
  );
}
