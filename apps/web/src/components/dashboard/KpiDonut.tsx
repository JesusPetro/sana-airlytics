'use client';

import { useTranslations } from 'next-intl';
import { Skel } from '@/components/ui/Skeleton';
import type { KpiSpecNoThresh } from '@/lib/constants';

interface Props {
  spec:        KpiSpecNoThresh;
  latestValue: number | null;
  isLoading:   boolean;
  size?:       number;
}

export function KpiDonut({ spec, latestValue, isLoading, size = 88 }: Props) {
  const t = useTranslations();

  const ratio =
    latestValue !== null
      ? Math.min(1, Math.max(0, (latestValue - spec.softMin) / (spec.softMax - spec.softMin)))
      : 0;

  const SIZE  = size;
  const R     = Math.round(size * 32 / 88);
  const SW    = Math.max(4, Math.round(size * 6 / 88));
  const cx    = SIZE / 2;
  const cy    = SIZE / 2;
  const circ  = 2 * Math.PI * R;
  const filled = ratio * circ;
  const id    = `dg-${spec.code}`;

  const val = latestValue !== null
    ? latestValue.toFixed(spec.code === 'temperature' ? 1 : 0)
    : '—';

  const pad  = Math.round(size * 16 / 88);
  const fVal = Math.round(size * 15 / 88);
  const fUnit = Math.max(8, Math.round(size * 9 / 88));
  const fName = Math.max(10, Math.round(size * 11 / 88));
  const fRange = Math.max(9, Math.round(size * 10 / 88));

  if (isLoading) {
    return (
      <div style={{
        background: 'var(--color-surface)', borderRadius: '14px',
        padding: `${pad}px ${Math.round(pad * 0.75)}px`, boxShadow: 'var(--shadow-sm)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
        flex: '1 1 130px', minWidth: '130px', justifyContent: 'center',
      }}>
        <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE}>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--color-surface-2)" strokeWidth={SW} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skel w={28} h={11} r={4} />
          </div>
        </div>
        <Skel w={48} h={9} r={4} />
      </div>
    );
  }

  return (
    <div style={{
      background:     'var(--color-surface)',
      borderRadius:   '14px',
      padding:        `${pad}px ${Math.round(pad * 0.75)}px`,
      boxShadow:      'var(--shadow-sm)',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            '10px',
      flex:           '1 1 130px',
      minWidth:       '130px',
    }}>
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="var(--color-primary)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--color-accent-violet)" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          {/* track */}
          <circle
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke="var(--color-surface-2)"
            strokeWidth={SW}
          />
          {/* fill */}
          <circle
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke={latestValue !== null ? `url(#${id})` : 'var(--color-surface-2)'}
            strokeWidth={SW}
            strokeDasharray={`${filled.toFixed(2)} ${(circ - filled).toFixed(2)}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 600ms cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>

        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '2px',
        }}>
          <span style={{
            fontSize:      `${fVal}px`,
            fontWeight:    700,
            color:         'var(--color-text-primary)',
            lineHeight:    1,
            letterSpacing: '-0.02em',
          }}>
            {val}
          </span>
          {spec.unit && latestValue !== null && (
            <span style={{ fontSize: `${fUnit}px`, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {spec.unit}
            </span>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: `${fName}px`, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          {t(spec.labelKey)}
        </span>
        {latestValue !== null && (
          <span style={{ fontSize: `${fRange}px`, color: 'var(--color-text-disabled)' }}>
            {spec.softMin}–{spec.softMax}{spec.unit ? ` ${spec.unit}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}
