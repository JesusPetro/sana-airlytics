'use client';

import { KpiCard } from './KpiCard';
import { KPI_SPECS_THRESH } from '@/lib/constants';
import type { DashboardEntry } from '@/hooks/useDashboard';

interface Props {
  data: Record<string, DashboardEntry>;
  isLoading: boolean;
}

export function KpiGrid({ data, isLoading }: Props) {
  return (
    <div
      style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap:                 '12px',
      }}
    >
      {KPI_SPECS_THRESH.map((spec) => (
        <KpiCard
          key={spec.code}
          spec={spec}
          latestValue={data[spec.code]?.latestValue ?? null}
          buckets={data[spec.code]?.buckets ?? []}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
