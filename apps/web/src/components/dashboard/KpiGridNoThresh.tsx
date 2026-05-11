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
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-disabled)' }}>
        * Promedio del último día registrado
      </p>
    </div>
  );
}
