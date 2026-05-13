'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Skel } from '@/components/ui/Skeleton';
import { formatTime } from '@/lib/format';
import type { ChartPoint } from '@/types/analytics';

const ResponsiveContainer = dynamic(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(m => ({ default: m.LineChart })), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => ({ default: m.Line })), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => ({ default: m.XAxis })), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => ({ default: m.YAxis })), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => ({ default: m.Tooltip })), { ssr: false });
const Legend = dynamic(() => import('recharts').then(m => ({ default: m.Legend })), { ssr: false });
const Brush = dynamic(() => import('recharts').then(m => ({ default: m.Brush })), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => ({ default: m.CartesianGrid })), { ssr: false });

interface Series {
  code:  string;
  label: string;
  color: string;
  data:  ChartPoint[];
}

interface Props {
  series:     Series[];
  isLoading:  boolean;
  isFetching: boolean;
  noDataMsg:  string;
  chartKey:   string;
}

interface MergedPoint {
  time: string;
  [code: string]: number | null | string;
}

function mergeSeries(series: Series[]): MergedPoint[] {
  if (series.length === 0) return [];
  const map: Record<string, MergedPoint> = {};
  for (const s of series) {
    for (const p of s.data) {
      if (!map[p.time]) map[p.time] = { time: p.time };
      map[p.time][s.code] = p.value;
    }
  }
  return Object.values(map).sort((a, b) => (a.time < b.time ? -1 : 1));
}

export function TimeSeriesChart({ series, isLoading, isFetching, noDataMsg, chartKey }: Props) {
  const t = useTranslations();

  if (isLoading) {
    return (
      <div style={{ height: 280, display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
        <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
          <div style={{ width: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '28px' }}>
            {Array.from({ length: 5 }).map((_, i) => <Skel key={i} w={28} h={10} />)}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skel w="100%" h="100%" r={6} style={{ flex: 1 }} />
            <Skel w="100%" h={24} r={4} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '44px' }}>
          {Array.from({ length: 5 }).map((_, i) => <Skel key={i} w={40} h={10} />)}
        </div>
      </div>
    );
  }

  if (series.length === 0 || series.every((s) => s.data.length === 0)) {
    return (
      <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-text-secondary)', fontSize: '13px' }}>
        {noDataMsg}
      </div>
    );
  }

  const chartData = mergeSeries(series);

  const fetchingDotStyle: React.CSSProperties = {
    position:     'absolute',
    top:          6,
    right:        8,
    width:        6,
    height:       6,
    borderRadius: '50%',
    background:   'var(--color-primary)',
    opacity:      0.7,
    zIndex:       1,
    animation:    'skelPulse 1.4s ease-in-out infinite',
  };

  return (
    <div style={{ position: 'relative' }}>
      {isFetching && (
        <div style={fetchingDotStyle} />
      )}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          key={chartKey}
          data={chartData}
          margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke="var(--color-border)" strokeOpacity={0.4} vertical={false} />
          <XAxis
            dataKey="time"
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
            width={40}
            tickFormatter={(v) => Number(v).toFixed(2)}
          />
          <Tooltip
            isAnimationActive={false}
            contentStyle={{
              background:   'var(--color-surface)',
              border:       '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize:     '12px',
            }}
            labelFormatter={(v) => formatTime(String(v))}
            formatter={(v) => [typeof v === 'number' ? v.toFixed(2) : v]}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-secondary)' }} />
          {series.map((s) => (
            <Line
              key={s.code}
              type="linear"
              dataKey={s.code}
              name={s.label}
              stroke={s.color}
              strokeWidth={1.5}
              isAnimationActive={false}
              dot={{ r: 2.5, fill: s.color, strokeWidth: 0 }}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls={false}
            />
          ))}
          <Brush
            dataKey="time"
            height={24}
            tickFormatter={(v) => formatTime(String(v))}
            stroke="var(--color-border)"
            fill="var(--color-surface-subtle)"
            travellerWidth={6}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
