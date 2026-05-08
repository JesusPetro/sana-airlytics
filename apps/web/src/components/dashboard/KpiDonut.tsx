'use client';

import { useTranslations } from 'next-intl';
import { formatValue } from '@/lib/format';
import { Skel } from '@/components/ui/Skeleton';
import type { KpiSpecNoThresh } from '@/lib/constants';

interface Props {
  spec: KpiSpecNoThresh;
  latestValue: number | null;
  isLoading: boolean;
}

export function KpiDonut({ spec, latestValue, isLoading }: Props) {
  const t = useTranslations();

  if (isLoading) {
    return (
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '12px', padding: '16px', display: 'flex',
        flexDirection: 'column', alignItems: 'center', gap: '10px',
      }}>
        <div style={{ position: 'relative', width: 72, height: 72 }}>
          <svg width={72} height={72}>
            <circle cx={36} cy={36} r={28} fill="none" stroke="var(--color-surface-2)" strokeWidth={6} />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Skel w={28} h={10} r={4} />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {t(spec.labelKey)}
          </div>
        </div>
      </div>
    );
  }

  const ratio =
    latestValue !== null
      ? Math.min(
          1,
          Math.max(0, (latestValue - spec.softMin) / (spec.softMax - spec.softMin)),
        )
      : 0;

  const R = 28;
  const stroke = 6;
  const cx = 36;
  const cy = 36;
  const circumference = 2 * Math.PI * R;
  const dash = ratio * circumference;

  return (
    <div
      style={{
        background:    'var(--color-surface)',
        border:        '1px solid var(--color-border)',
        borderRadius:  '12px',
        padding:       '16px',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           '8px',
      }}
    >
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <svg width={72} height={72}>
          <circle
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke="var(--color-surface-subtle)"
            strokeWidth={stroke}
          />
          <circle
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke="var(--color-no-threshold, #6366f1)"
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 400ms ease' }}
          />
        </svg>
        <div
          style={{
            position:   'absolute',
            inset:      0,
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize:   '11px',
            fontWeight: 700,
            color:      'var(--color-text-primary)',
            textAlign:  'center',
            lineHeight: 1.1,
          }}
        >
          {isLoading ? '…' : latestValue !== null ? latestValue.toFixed(spec.code === 'temperature' ? 1 : 0) : '—'}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {t(spec.labelKey)}
        </div>
        {spec.unit && (
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', opacity: 0.7 }}>
            {spec.unit}
          </div>
        )}
      </div>
    </div>
  );
}
