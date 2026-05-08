'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useState, useMemo } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useDevices } from '@/hooks/useDevices';
import { useDashboard } from '@/hooks/useDashboard';
import { useTimeRange, rangeToISO } from '@/hooks/useTimeRange';
import { levelFromValue } from '@/lib/aqi';
import type { DeviceStatusResponse } from '@/types/sensor';

const MiniMap = dynamic(
  () => import('./MiniMapInner').then((m) => m.MiniMapInner),
  {
    ssr: false,
    loading: () => (
      <div style={{
        width: '100%', height: '100%',
        background: 'var(--color-surface-2)',
        animation: 'skelPulse 1.5s ease-in-out infinite',
      }} />
    ),
  },
);

export function MapPreview() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const { activeWorkspace } = useWorkspace();
  const { range } = useTimeRange();
  const { from, to } = rangeToISO(range);
  const [heatmap, setHeatmap] = useState(false);

  const { data: devices = [] } = useDevices(activeWorkspace?.workspace_id);
  const { data: dashData } = useDashboard(activeWorkspace?.workspace_id, from, to);

  const pm2_5Map = useMemo(() => {
    const m: Record<string, number | null> = {};
    for (const d of devices) {
      m[d.device_id] = dashData['pm2_5']?.latestValue ?? null;
    }
    return m;
  }, [devices, dashData]);

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>
          {t('map.title')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Points / Heatmap mini toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--color-surface-subtle)',
            borderRadius: '8px',
            padding: '2px',
            gap: '2px',
          }}>
            {[false, true].map((isHeat) => (
              <button
                key={String(isHeat)}
                onClick={() => setHeatmap(isHeat)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: heatmap === isHeat ? 600 : 400,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: heatmap === isHeat ? 'var(--color-surface)' : 'transparent',
                  color: heatmap === isHeat ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  boxShadow: heatmap === isHeat ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {isHeat ? t('map.heatmap') : t('map.points')}
              </button>
            ))}
          </div>
          <button
            onClick={() => router.push(`/${locale}/mapa`)}
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--color-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
            }}
          >
            {t('map.expand')} →
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ height: '260px' }}>
        <MiniMap devices={devices} pm2_5Map={pm2_5Map} heatmap={heatmap} />
      </div>
    </div>
  );
}
