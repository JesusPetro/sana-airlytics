'use client';

import { useTranslations, useLocale } from 'next-intl';
import { KpiDonut } from './KpiDonut';
import { KPI_SPECS_NOTHRESH } from '@/lib/constants';
import type { DashboardEntry } from '@/hooks/useDashboard';

interface Props {
  data: Record<string, DashboardEntry>;
  isLoading: boolean;
}

export function KpiGridNoThresh({ data, isLoading }: Props) {
  const t      = useTranslations();
  const locale = useLocale();

  const lastDate = KPI_SPECS_NOTHRESH
    .map((s) => data[s.code]?.lastDayDate)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);

  const dateLabel = lastDate
    ? new Date(lastDate).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        style={{
          display:    'flex',
          flex:       1,
          flexWrap:   'wrap',
          gap:        '12px',
          alignItems: 'stretch',
        }}
      >
        {KPI_SPECS_NOTHRESH.map((spec) => (
          <KpiDonut
            key={spec.code}
            spec={spec}
            latestValue={data[spec.code]?.latestValue ?? null}
            isLoading={isLoading}
            size={130}
          />
        ))}
      </div>
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-disabled)' }}>
        {t('kpiGrid.avgNote')}{dateLabel ? ` — ${dateLabel}` : ''}
      </p>
    </div>
  );
}
