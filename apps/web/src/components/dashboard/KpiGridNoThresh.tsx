'use client';

import { KpiDonut } from './KpiDonut';
import { KPI_SPECS_NOTHRESH } from '@/lib/constants';
import type { DashboardEntry } from '@/hooks/useDashboard';

interface Props {
  data: Record<string, DashboardEntry>;
  isLoading: boolean;
}

export function KpiGridNoThresh({ data, isLoading }: Props) {
  return (
    <div
      style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap:                 '12px',
      }}
    >
      {KPI_SPECS_NOTHRESH.map((spec) => (
        <KpiDonut
          key={spec.code}
          spec={spec}
          latestValue={data[spec.code]?.latestValue ?? null}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
