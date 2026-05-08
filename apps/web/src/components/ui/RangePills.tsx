'use client';

import { Suspense } from 'react';
import { type TimeRange, useTimeRange } from '@/hooks/useTimeRange';

const RANGES: TimeRange[] = ['1H', '6H', '24H', '7D'];

function RangePillsInner() {
  const { range, setRange } = useTimeRange();

  return (
    <div
      role="tablist"
      aria-label="Rango temporal"
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        background:   'var(--color-surface-subtle)',
        border:       '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-full)',
        padding:      '3px',
        gap:          '2px',
      }}
    >
      {RANGES.map((r) => {
        const active = r === range;
        return (
          <button
            key={r}
            role="tab"
            aria-selected={active}
            onClick={() => setRange(r)}
            style={{
              height:       '26px',
              padding:      '0 12px',
              borderRadius: 'var(--radius-full)',
              fontSize:     '0.75rem',
              fontWeight:   500,
              border:       'none',
              cursor:       'pointer',
              transition:   'background 140ms, color 140ms',
              background:   active ? 'var(--color-surface)' : 'transparent',
              color:        active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              boxShadow:    active ? 'var(--shadow-sm)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!active)
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              if (!active)
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
            }}
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
    <Suspense
      fallback={
        <div
          style={{
            display:      'inline-flex',
            height:       '32px',
            width:        '148px',
            borderRadius: 'var(--radius-full)',
            background:   'var(--color-surface-subtle)',
            border:       '1px solid var(--color-border-subtle)',
          }}
        />
      }
    >
      <RangePillsInner />
    </Suspense>
  );
}
