'use client';

import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useTimeRange, rangeToISO } from '@/hooks/useTimeRange';
import { KpiGrid } from '@/components/dashboard/KpiGrid';
import { KpiGridNoThresh } from '@/components/dashboard/KpiGridNoThresh';
import { TimeSeriesCard } from '@/components/dashboard/TimeSeriesCard';
import { AlertSummary } from '@/components/dashboard/AlertSummary';
import { MapPreview } from '@/components/dashboard/MapPreview';
import { EmptyWorkspace } from '@/components/ui/EmptyWorkspace';

export default function DashboardPage() {
  const t = useTranslations();
  const { activeWorkspace, isLoading: wsLoading } = useWorkspace();
  const { range } = useTimeRange();
  const { from, to } = rangeToISO(range);

  const { data, isLoading } = useDashboard(activeWorkspace?.workspace_id, from, to);

  const datastreams = Object.values(data).map((e) => e.datastream);

  if (wsLoading) {
    return <EmptyWorkspace msg={t('common.loading')} />;
  }

  if (!activeWorkspace) {
    return <EmptyWorkspace msg={t('dashboard.noWorkspace')} />;
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
        {t('dashboard.title')}
      </h1>

      <section>
        <KpiGrid data={data} isLoading={isLoading} />
      </section>

      <section>
        <KpiGridNoThresh data={data} isLoading={isLoading} />
      </section>

      <section>
        <MapPreview />
      </section>

      <section>
        <TimeSeriesCard datastreams={datastreams} />
      </section>

      <section>
        <AlertSummary />
      </section>
    </div>
  );
}
