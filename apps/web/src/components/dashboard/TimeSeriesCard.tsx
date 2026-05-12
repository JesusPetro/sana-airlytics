'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useTimeSeries, type BucketOption } from '@/hooks/useTimeSeries';
import { TS_VARS } from '@/lib/constants';
import { VarChips } from './VarChips';
import { TimeSeriesChart } from './TimeSeriesChart';
import type { DatastreamResponse, ChartPoint } from '@/types/analytics';

interface Props {
  datastreams:      DatastreamResponse[];
  selectedSensorId: string;
}

const BUCKET_VALUES: BucketOption[] = ['5m', '15m', '30m', '1h', '6h', '1d', 'raw'];

const BUCKET_KEY: Record<BucketOption, string> = {
  '5m':  'timeSeries.bucket5m',
  '15m': 'timeSeries.bucket15m',
  '30m': 'timeSeries.bucket30m',
  '1h':  'timeSeries.bucket1h',
  '6h':  'timeSeries.bucket6h',
  '1d':  'timeSeries.bucket1d',
  'raw': 'timeSeries.bucketRaw',
};

// days: 0 = "All" (no date window — fetches from 2020-01-01 to now)
const PRESETS = [
  { days: 0,  key: 'timeSeries.rangeAll' },
  { days: 1,  key: 'timeSeries.range1d'  },
  { days: 7,  key: 'timeSeries.range7d'  },
  { days: 30, key: 'timeSeries.range30d' },
  { days: 90, key: 'timeSeries.range90d' },
];

export function TimeSeriesCard({ datastreams, selectedSensorId }: Props) {
  const t = useTranslations();
  const { activeWorkspace } = useWorkspace();

  const [selectedCodes, setSelectedCodes] = useState<string[]>(['pm2_5']);
  const [bucket, setBucket]               = useState<BucketOption>('30m');
  const [presetDays, setPresetDays]       = useState<number>(7);

  // Codes available for the currently selected sensor (datastreams already filtered by page)
  const availableCodes = useMemo(() => new Set(
    datastreams.map((d) => d.property_code.toLowerCase()),
  ), [datastreams]);

  // When sensor changes, keep only selected codes that the new sensor has.
  useEffect(() => {
    setSelectedCodes((prev) => {
      const valid = prev.filter((c) => availableCodes.has(c));
      if (valid.length > 0) return valid;
      const first = availableCodes.values().next().value;
      return first ? [first] : [];
    });
  }, [availableCodes]);

  function selectPreset(days: number) { setPresetDays(days); }

  // presetDays === 0 → "All": static far-past/far-future dates so no data is excluded.
  // Otherwise, compute from/to from presetDays so the hook fetches the correct window.
  const { resolvedFrom, resolvedTo } = useMemo(() => {
    if (presetDays === 0) {
      return { resolvedFrom: '2020-01-01T00:00:00.000Z', resolvedTo: '2099-12-31T23:59:59.000Z' };
    }
    const to = new Date();
    to.setSeconds(0, 0);
    const from = new Date(to.getTime() - presetDays * 24 * 60 * 60 * 1000);
    return { resolvedFrom: from.toISOString(), resolvedTo: to.toISOString() };
  }, [presetDays]);

  const datastreamIds = selectedCodes
    .map((code) =>
      datastreams.find(
        (d) => d.property_code.toLowerCase() === code && (!selectedSensorId || d.sensor_id === selectedSensorId),
      ),
    )
    .filter(Boolean)
    .map((d) => d!.datastream_id);

  const { data, isLoading, isFetching } = useTimeSeries(
    activeWorkspace?.workspace_id,
    datastreamIds,
    bucket,
    resolvedFrom,
    resolvedTo,
  );

  const series = selectedCodes
    .map((code) => {
      const tsVar = TS_VARS.find((v) => v.code === code);
      const ds    = datastreams.find(
        (d) => d.property_code.toLowerCase() === code && (!selectedSensorId || d.sensor_id === selectedSensorId),
      );
      if (!tsVar || !ds) return null;
      return {
        code,
        label: t(tsVar.labelKey),
        color: tsVar.color,
        data:  (data[ds.datastream_id] ?? []) as ChartPoint[],
      };
    })
    .filter(Boolean) as { code: string; label: string; color: string; data: ChartPoint[] }[];

  const pillStyle = (active: boolean): React.CSSProperties => ({
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
  });

  const pillGroupStyle: React.CSSProperties = {
    display:      'inline-flex',
    alignItems:   'center',
    background:   'var(--color-surface-subtle)',
    border:       '1px solid var(--color-border-subtle)',
    borderRadius: 'var(--radius-full)',
    padding:      '3px',
    gap:          '2px',
    whiteSpace:   'nowrap',
  };

  return (
    <div
      style={{
        background:    'var(--color-surface)',
        border:        '1px solid var(--color-border)',
        borderRadius:  '12px',
        padding:       '20px',
        display:       'flex',
        flexDirection: 'column',
        gap:           '16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {t('timeSeries.title')}
        </span>
      </div>

      {/* Controls row: bucket + presets + date picker */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Bucket pills */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', flex: 1, minWidth: 0 }}>
          <div role="tablist" aria-label={t('timeSeries.groupByLabel')} style={pillGroupStyle}>
            {BUCKET_VALUES.map((val) => (
              <button
                key={val}
                type="button"
                role="tab"
                aria-selected={val === bucket}
                onClick={() => setBucket(val)}
                style={pillStyle(val === bucket)}
              >
                {t(BUCKET_KEY[val])}
              </button>
            ))}
          </div>
        </div>

        {/* Preset range pills */}
        <div role="tablist" aria-label={t('timeSeries.rangeLabel')} style={{ ...pillGroupStyle, flexShrink: 0 }}>
          {PRESETS.map((r) => (
            <button
              key={r.days}
              type="button"
              role="tab"
              aria-selected={presetDays === r.days}
              onClick={() => selectPreset(r.days)}
              style={pillStyle(presetDays === r.days)}
            >
              {t(r.key)}
            </button>
          ))}
        </div>

      </div>

      <VarChips vars={TS_VARS} selected={selectedCodes} onChange={setSelectedCodes} max={4} />

      <TimeSeriesChart
        series={series}
        isLoading={isLoading}
        isFetching={isFetching}
        noDataMsg={selectedCodes.length === 0 ? t('timeSeries.noVars') : t('timeSeries.noData')}
        chartKey={`${bucket}-${presetDays}`}
      />
    </div>
  );
}
