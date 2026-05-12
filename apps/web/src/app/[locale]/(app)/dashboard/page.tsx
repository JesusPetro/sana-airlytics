'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useDashboard } from '@/hooks/useDashboard';
import { KpiGridNoThresh } from '@/components/dashboard/KpiGridNoThresh';
import { AqiHeatmap } from '@/components/dashboard/AqiHeatmap';
import { TimeSeriesCard } from '@/components/dashboard/TimeSeriesCard';
import { AlertSummary } from '@/components/dashboard/AlertSummary';
import { MapPreview } from '@/components/dashboard/MapPreview';
import { EmptyWorkspace } from '@/components/ui/EmptyWorkspace';

export default function DashboardPage() {
  const t = useTranslations();
  const { activeWorkspace, isLoading: wsLoading } = useWorkspace();

  const [selectedSensorId, setSelectedSensorId] = useState<string>('');

  // First call: fetches datastreams + KPI data (no sensor filter yet on first render)
  const { data, isLoading, dsIsLoading, datastreams } = useDashboard(
    activeWorkspace?.workspace_id,
    selectedSensorId || undefined,
  );

  const devices = useMemo(() =>
    Array.from(
      new Map(datastreams.map((d) => [d.sensor_id, { id: d.sensor_id, name: d.sensor_name }])).values(),
    ),
    [datastreams],
  );

  // Initialize to first device once datastreams load
  useEffect(() => {
    if (selectedSensorId === '' && devices.length > 0) {
      setSelectedSensorId(devices[0].id);
    }
  }, [devices, selectedSensorId]);

  const sensorDatastreams = useMemo(() =>
    selectedSensorId
      ? datastreams.filter((d) => d.sensor_id === selectedSensorId)
      : datastreams,
    [datastreams, selectedSensorId],
  );

  const hasData = datastreams.length > 0;

  if (wsLoading) {
    return <EmptyWorkspace msg={t('common.loading')} />;
  }

  if (!activeWorkspace) {
    return <EmptyWorkspace msg={t('dashboard.noWorkspace')} />;
  }

  if (!dsIsLoading && !hasData) {
    return (
      <div
        style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          height:         'calc(100vh - var(--topbar-h))',
          gap:            '8px',
        }}
      >
        <span style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
          {t('dashboard.noSensors')}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {t('dashboard.noSensorsHint')}
        </span>
      </div>
    );
  }

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding:      '4px 12px',
    borderRadius: 'var(--radius-full)',
    fontSize:     '12px',
    fontWeight:   500,
    cursor:       'pointer',
    border:       active ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
    background:   active ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent',
    color:        active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
    transition:   'all 140ms ease',
    whiteSpace:   'nowrap' as const,
  });

  return (
    <div className="flex flex-col gap-5 p-4 md:px-8 md:py-6">

      {/* Sensor picker — global filter for all dashboard widgets */}
      {devices.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
            {t('dashboard.sensor')}
          </span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {devices.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedSensorId(d.id)}
                style={pillStyle(d.id === selectedSensorId)}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Row 1 — métricas sin umbral | heatmap AQI */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] md:items-stretch">
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: '-0.01em' }}>
            {t('dashboard.noThreshold')}
          </h2>
          <KpiGridNoThresh data={data} isLoading={isLoading} />
        </section>

        <section style={{
          background:    'var(--color-surface)',
          border:        '1px solid var(--color-border)',
          borderRadius:  '12px',
          padding:       '18px',
          display:       'flex',
          flexDirection: 'column',
          gap:           '14px',
        }}>
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: '-0.01em' }}>
            {t('dashboard.aqiHistory')}
          </h2>
          <AqiHeatmap workspaceId={activeWorkspace?.workspace_id} datastreams={sensorDatastreams} />
        </section>
      </div>

      {/* Row 2 — Serie temporal (full width) */}
      <section>
        <TimeSeriesCard datastreams={sensorDatastreams} selectedSensorId={selectedSensorId} />
      </section>

      {/* Row 3 — Mapa | Alertas */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-start">
        <section>
          <MapPreview selectedSensorId={selectedSensorId} />
        </section>
        <section>
          <AlertSummary />
        </section>
      </div>
    </div>
  );
}
