'use client';

import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useDashboard } from '@/hooks/useDashboard';
import { KpiGrid } from '@/components/dashboard/KpiGrid';
import { KpiGridNoThresh } from '@/components/dashboard/KpiGridNoThresh';
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

      {/* Row 1 — KPIs con umbral | sin umbral */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
        gap: '20px',
        alignItems: 'start',
      }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
            {t('dashboard.withThreshold')}
          </h2>
          <KpiGrid data={data} isLoading={isLoading} />
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
            {t('dashboard.noThreshold')}
          </h2>
          <KpiGridNoThresh data={data} isLoading={isLoading} />
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
