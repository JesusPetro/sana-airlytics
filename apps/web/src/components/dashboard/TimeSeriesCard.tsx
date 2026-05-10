'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useTimeSeries, type BucketOption } from '@/hooks/useTimeSeries';
import { TS_VARS } from '@/lib/constants';
import { VarChips } from './VarChips';
import { TimeSeriesChart } from './TimeSeriesChart';
import { Select } from '@/components/ui/Select';
import type { DatastreamResponse, ChartPoint } from '@/types/analytics';

interface Props {
  datastreams: DatastreamResponse[];
}

interface BucketDef {
  value: BucketOption;
  label: string;
}

const BUCKETS: BucketDef[] = [
  { value: '5m',  label: '5 min'  },
  { value: '15m', label: '15 min' },
  { value: '30m', label: '30 min' },
  { value: '1h',  label: '1 h'   },
  { value: '6h',  label: '6 h'   },
  { value: '1d',  label: '1 día'  },
  { value: 'raw', label: 'Sin filtros' },
];

export function TimeSeriesCard({ datastreams }: Props) {
  const t = useTranslations();
  const { activeWorkspace } = useWorkspace();

  const devices = Array.from(
    new Map(datastreams.map((d) => [d.sensor_id, { id: d.sensor_id, name: d.sensor_name }])).values(),
  );

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.id ?? '');
  const [selectedCodes, setSelectedCodes]       = useState<string[]>(['pm2_5']);
  const [bucket, setBucket]                     = useState<BucketOption>('30m');

  useEffect(() => {
    if (selectedDeviceId === '' && devices.length > 0) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  const datastreamIds = selectedCodes
    .map((code) =>
      datastreams.find(
        (d) => d.property_code.toLowerCase() === code && d.sensor_id === selectedDeviceId,
      ),
    )
    .filter(Boolean)
    .map((d) => d!.datastream_id);

  const { data, isLoading, isFetching } = useTimeSeries(
    activeWorkspace?.workspace_id,
    datastreamIds,
    bucket,
  );

  const series = selectedCodes
    .map((code) => {
      const tsVar = TS_VARS.find((v) => v.code === code);
      const ds    = datastreams.find(
        (d) => d.property_code.toLowerCase() === code && d.sensor_id === selectedDeviceId,
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

        {devices.length > 0 ? (
          <Select
            value={selectedDeviceId}
            onChange={setSelectedDeviceId}
            options={devices.map(d => ({ value: d.id, label: d.name }))}
            style={{ width: 'auto', padding: '4px 8px', fontSize: '12px', borderRadius: '6px' }}
          />
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {t('timeSeries.noDevice')}
          </span>
        )}
      </div>

      {/* Bucket pills */}
      <div
        role="tablist"
        aria-label="Agrupación"
        style={{
          display:      'inline-flex',
          alignItems:   'center',
          background:   'var(--color-surface-subtle)',
          border:       '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-full)',
          padding:      '3px',
          gap:          '2px',
          alignSelf:    'flex-start',
        }}
      >
        {BUCKETS.map((b) => {
          const active = b.value === bucket;
          return (
            <button
              key={b.value}
              role="tab"
              aria-selected={active}
              onClick={() => setBucket(b.value)}
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
            >
              {b.label}
            </button>
          );
        })}
      </div>

      <VarChips vars={TS_VARS} selected={selectedCodes} onChange={setSelectedCodes} max={4} />

      <TimeSeriesChart
        series={series}
        isLoading={isLoading}
        isFetching={isFetching}
        noDataMsg={selectedCodes.length === 0 ? t('timeSeries.noVars') : t('timeSeries.noData')}
        chartKey={bucket}
      />
    </div>
  );
}
