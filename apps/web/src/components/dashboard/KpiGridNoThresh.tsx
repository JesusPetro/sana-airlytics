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
        display:    'flex',
        flex:       1,
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
  );
}
