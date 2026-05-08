'use client';

import { useTranslations } from 'next-intl';
import { levelFromValue, colorFromLevel } from '@/lib/aqi';
import { formatValue } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Skel } from '@/components/ui/Skeleton';
import type { KpiSpecThresh } from '@/lib/constants';
import type { AggregationBucketResponse } from '@/types/analytics';

interface Props {
  spec: KpiSpecThresh;
  latestValue: number | null;
  buckets: AggregationBucketResponse[];
  isLoading: boolean;
}

function Sparkline({ buckets }: { buckets: AggregationBucketResponse[] }) {
  const points = buckets.slice(-24).map((b) => b.avg_value ?? 0);
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const W = 80;
  const H = 28;
  const step = W / (points.length - 1);

  const d = points
    .map((v, i) => {
      const x = i * step;
      const y = H - ((v - min) / range) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.6} />
    </svg>
  );
}

export function KpiCard({ spec, latestValue, buckets, isLoading }: Props) {
  const t = useTranslations();
  const level = latestValue !== null ? levelFromValue(spec.code, latestValue) : null;
  const borderColor = level ? colorFromLevel(level.id) : 'var(--color-border)';

  if (isLoading) {
    return (
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {t(spec.labelKey)}
          </span>
          <Skel w={48} h={18} r={9} />
        </div>
        <Skel w={80} h={28} r={6} />
        <Skel w="100%" h={28} r={4} />
      </div>
    );
  }

  return (
    <div
      style={{
        background:   'var(--color-surface)',
        border:       `1px solid ${borderColor}`,
        borderRadius: '12px',
        padding:      '16px',
        display:      'flex',
        flexDirection:'column',
        gap:          '8px',
        minWidth:     0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {t(spec.labelKey)}
        </span>
        {level && (
          <Badge level={level.id} label={t(level.labelKey)} />
        )}
      </div>

      <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>
        {formatValue(spec.code, latestValue)}
      </div>

      <div style={{ color: borderColor }}>
        <Sparkline buckets={buckets} />
      </div>
    </div>
  );
}
