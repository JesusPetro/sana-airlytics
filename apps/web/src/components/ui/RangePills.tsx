'use client';

import { Suspense } from 'react';
import { type TimeRange, useTimeRange } from '@/hooks/useTimeRange';

const RANGES: TimeRange[] = ['1H', '6H', '24H', '7D'];

function RangePillsInner() {
  const { range, setRange } = useTimeRange();

  return (
    <div className="flex items-center gap-1">
      {RANGES.map((r) => {
        const active = r === range;
        return (
          <button
            key={r}
            onClick={() => setRange(r)}
            style={
              active
                ? { background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' }
                : {
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-secondary)',
                    borderColor: 'var(--color-border)',
                  }
            }
            className="h-8 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors duration-150 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1"
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}

export function RangePills() {
  return (
    <Suspense fallback={<div className="h-8 w-37 animate-pulse rounded-full bg-surface-2" />}>
      <RangePillsInner />
    </Suspense>
  );
}
