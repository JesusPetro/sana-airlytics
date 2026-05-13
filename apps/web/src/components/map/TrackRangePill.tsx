'use client';

import type React from 'react';

export type TrackRange = '1H' | '6H' | '1D' | '7D' | '1M' | 'All';

const RANGES: TrackRange[] = ['1H', '6H', '1D', '7D', '1M', 'All'];

export function trackRangeToISO(range: TrackRange): { from: string; to: string } {
  const to = new Date();
  to.setSeconds(0, 0); // floor al minuto → query key estable dentro del mismo minuto
  const from = new Date(to);
  switch (range) {
    case '1H':  from.setHours(to.getHours() - 1);   break;
    case '6H':  from.setHours(to.getHours() - 6);   break;
    case '1D':  from.setDate(to.getDate() - 1);     break;
    case '7D':  from.setDate(to.getDate() - 7);     break;
    case '1M':  from.setMonth(to.getMonth() - 1);   break;
    case 'All': return { from: '2020-01-01T00:00:00.000Z', to: to.toISOString() };
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

interface TrackRangePillProps {
  value: TrackRange;
  onChange: (r: TrackRange) => void;
}

const wrapperStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '24px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1000,
  display: 'inline-flex',
  alignItems: 'center',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '9999px',
  boxShadow: 'var(--shadow-md)',
  padding: '3px',
  gap: '2px',
  fontFamily: 'var(--font-sans, inherit)',
};

export function TrackRangePill({ value, onChange }: TrackRangePillProps) {
  return (
    <div role="tablist" aria-label="Rango de puntos" style={wrapperStyle}>
      {RANGES.map((r) => {
        const active = r === value;
        const btnStyle: React.CSSProperties = {
          height: '26px',
          padding: '0 11px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: active ? 600 : 400,
          fontFamily: 'inherit',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 140ms, color 140ms',
          background: active ? 'var(--color-primary)' : 'transparent',
          color: active ? '#fff' : 'var(--color-text-secondary)',
          boxShadow: active ? 'var(--shadow-sm)' : 'none',
        };
        return (
          <button
            key={r}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(r)}
            style={btnStyle}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}
