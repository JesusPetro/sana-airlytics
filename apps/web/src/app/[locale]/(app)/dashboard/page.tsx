'use client';

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

  const { data, isLoading, dsIsLoading } = useDashboard(activeWorkspace?.workspace_id);

  const datastreams = Object.values(data).map((e) => e.datastream);
  const hasData = Object.keys(data).length > 0;

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

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Row 1 — métricas sin umbral | heatmap AQI */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)',
        gap:                 '16px',
        alignItems:          'stretch',
      }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0', height: '100%' }}>
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
          <AqiHeatmap workspaceId={activeWorkspace?.workspace_id} datastreams={datastreams} />
        </section>
      </div>

      {/* Row 2 — Serie temporal (full width) */}
      <section>
        <TimeSeriesCard datastreams={datastreams} />
      </section>

      {/* Row 3 — Mapa | Alertas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
        gap: '20px',
        alignItems: 'start',
      }}>
        <section>
          <MapPreview />
        </section>
        <section>
          <AlertSummary />
        </section>
      </div>
    </div>
  );
}
