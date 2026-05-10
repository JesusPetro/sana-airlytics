'use client';

import { useTranslations } from 'next-intl';
import { levelFromValue, colorFromLevel } from '@/lib/aqi';
import { formatValue } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Skel } from '@/components/ui/Skeleton';
import type { KpiSpecThresh } from '@/lib/constants';
import type { AggregationBucketResponse } from '@/types/analytics';

interface Props {
  spec:        KpiSpecThresh;
  latestValue: number | null;
  buckets:     AggregationBucketResponse[];
  isLoading:   boolean;
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx  = ((prev.x + curr.x) / 2).toFixed(1);
    d += ` C${cpx},${prev.y.toFixed(1)} ${cpx},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
  }
  return d;
}

function Sparkline({ buckets, color, code }: { buckets: AggregationBucketResponse[]; color: string; code: string }) {
  const points = buckets.slice(-32).map((b) => b.avg_value ?? 0);
  if (points.length < 2) return <div style={{ height: 56 }} />;

  const min   = Math.min(...points);
  const max   = Math.max(...points);
  const range = max - min || 1;
  const W     = 300;
  const H     = 52;
  const pad   = 6;
  const step  = W / (points.length - 1);

  const pts = points.map((v, i) => ({
    x: i * step,
    y: H - pad - ((v - min) / range) * (H - pad * 2),
  }));

  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  const area = `${line} L${last.x.toFixed(1)},${H} L0,${H} Z`;
  const id   = `sg-${code}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={56} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KpiCard({ spec, latestValue, buckets, isLoading }: Props) {
  const t           = useTranslations();
  const level       = latestValue !== null ? levelFromValue(spec.code, latestValue) : null;
  const accentColor = level ? colorFromLevel(level.id) : 'var(--color-text-disabled)';

  if (isLoading) {
    return (
      <div style={{
        background:   'var(--color-surface)',
        borderRadius: '14px',
        padding:      '16px 16px 0',
        boxShadow:    'var(--shadow-sm)',
        overflow:     'hidden',
        display:      'flex', flexDirection: 'column', gap: '10px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skel w={52} h={9}  r={4} />
          <Skel w={44} h={18} r={9} />
        </div>
        <Skel w={80} h={28} r={6} />
        <Skel w="100%" h={56} r={0} style={{ margin: '0 -16px', width: 'calc(100% + 32px)' }} />
      </div>
    );
  }

  return (
    <div style={{
      background:    'var(--color-surface)',
      borderRadius:  '14px',
      padding:       '16px 16px 0',
      boxShadow:     'var(--shadow-sm)',
      overflow:      'hidden',
      display:       'flex',
      flexDirection: 'column',
      gap:           '6px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize:      '11px',
          fontWeight:    600,
          color:         'var(--color-text-secondary)',
          letterSpacing: '0.01em',
        }}>
          {t(spec.labelKey)}
        </span>
        {level && <Badge level={level.id} label={t(level.labelKey)} />}
      </div>

      <span style={{
        fontSize:      '28px',
        fontWeight:    700,
        color:         'var(--color-text-primary)',
        lineHeight:    1,
        letterSpacing: '-0.02em',
      }}>
        {formatValue(spec.code, latestValue)}
      </span>

      <div style={{ margin: '2px -16px 0', lineHeight: 0 }}>
        <Sparkline buckets={buckets} color={accentColor} code={spec.code} />
      </div>
    </div>
  );
}
