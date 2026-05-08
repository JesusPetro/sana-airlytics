'use client';

import { useTranslations } from 'next-intl';
import { Skel } from '@/components/ui/Skeleton';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Brush,
  CartesianGrid,
} from 'recharts';
import { formatTime } from '@/lib/format';
import type { AggregationBucketResponse } from '@/types/analytics';

interface Series {
  code:  string;
  label: string;
  color: string;
  data:  AggregationBucketResponse[];
}

interface Props {
  series:    Series[];
  isLoading: boolean;
  noDataMsg: string;
}

interface MergedPoint {
  bucket: string;
  [code: string]: number | null | string;
}

function mergeSeries(series: Series[]): MergedPoint[] {
  if (series.length === 0) return [];
  const bucketMap: Record<string, MergedPoint> = {};

  for (const s of series) {
    for (const b of s.data) {
      if (!bucketMap[b.bucket]) bucketMap[b.bucket] = { bucket: b.bucket };
      bucketMap[b.bucket][s.code] = b.avg_value;
    }
  }

  return Object.values(bucketMap).sort((a, b) =>
    a.bucket < b.bucket ? -1 : 1,
  );
}

export function TimeSeriesChart({ series, isLoading, noDataMsg }: Props) {
  const t = useTranslations();

  if (isLoading) {
    return (
      <div style={{ height: 260, display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
        <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
          {/* Y-axis ticks */}
          <div style={{ width: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '20px' }}>
            {Array.from({ length: 5 }).map((_, i) => <Skel key={i} w={28} h={10} />)}
          </div>
          {/* Chart area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skel w="100%" h="100%" r={6} style={{ flex: 1 }} />
            {/* Brush area */}
            <Skel w="100%" h={20} r={4} />
          </div>
        </div>
        {/* X-axis ticks */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '44px' }}>
          {Array.from({ length: 5 }).map((_, i) => <Skel key={i} w={40} h={10} />)}
        </div>
      </div>
    );
  }

  if (series.length === 0 || series.every((s) => s.data.length === 0)) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-text-secondary)', fontSize: '13px' }}>
        {noDataMsg}
      </div>
    );
  }

  const chartData = mergeSeries(series);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="var(--color-border)" strokeOpacity={0.4} vertical={false} />
        <XAxis
          dataKey="bucket"
          tickFormatter={(v) => formatTime(v)}
          tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
          tickLine={false}
          axisLine={false}
          minTickGap={60}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background:   'var(--color-surface)',
            border:       '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize:     '12px',
          }}
          labelFormatter={(v) => formatTime(String(v))}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}
        />
        {series.map((s) => (
          <Line
            key={s.code}
            type="monotone"
            dataKey={s.code}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
        ))}
        <Brush
          dataKey="bucket"
          height={20}
          tickFormatter={(v) => formatTime(String(v))}
          stroke="var(--color-border)"
          fill="var(--color-surface-subtle)"
          travellerWidth={6}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
