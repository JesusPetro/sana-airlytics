'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useTimeSeries } from '@/hooks/useTimeSeries';
import { useTimeRange, rangeToISO } from '@/hooks/useTimeRange';
import { TS_VARS } from '@/lib/constants';
import { VarChips } from './VarChips';
import { TimeSeriesChart } from './TimeSeriesChart';
import type { DatastreamResponse } from '@/types/analytics';

interface Props {
  datastreams: DatastreamResponse[];
}

export function TimeSeriesCard({ datastreams }: Props) {
  const t = useTranslations();
  const { activeWorkspace } = useWorkspace();
  const { range } = useTimeRange();
  const { from, to } = rangeToISO(range);

  const devices = Array.from(
    new Map(datastreams.map((d) => [d.sensor_id, { id: d.sensor_id, name: d.sensor_name }])).values(),
  );

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.id ?? '');
  const [selectedCodes, setSelectedCodes]       = useState<string[]>(['pm2_5']);

  const datastreamIds = selectedCodes
    .map((code) =>
      datastreams.find(
        (d) => d.property_code === code && d.sensor_id === selectedDeviceId,
      ),
    )
    .filter(Boolean)
    .map((d) => d!.datastream_id);

  const { data, isLoading } = useTimeSeries(
    activeWorkspace?.workspace_id,
    datastreamIds,
    from,
    to,
  );

  const series = selectedCodes
    .map((code) => {
      const tsVar = TS_VARS.find((v) => v.code === code);
      const ds    = datastreams.find(
        (d) => d.property_code === code && d.sensor_id === selectedDeviceId,
      );
      if (!tsVar || !ds) return null;
      return {
        code,
        label: t(tsVar.labelKey),
        color: tsVar.color,
        data:  data[ds.datastream_id] ?? [],
      };
    })
    .filter(Boolean) as { code: string; label: string; color: string; data: import('@/types/analytics').AggregationBucketResponse[] }[];

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {t('timeSeries.title')}
        </span>

        {devices.length > 0 ? (
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            style={{
              fontSize:     '12px',
              padding:      '4px 8px',
              borderRadius: '6px',
              border:       '1px solid var(--color-border)',
              background:   'var(--color-surface-subtle)',
              color:        'var(--color-text-primary)',
              cursor:       'pointer',
            }}
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {t('timeSeries.noDevice')}
          </span>
        )}
      </div>

      <VarChips vars={TS_VARS} selected={selectedCodes} onChange={setSelectedCodes} max={3} />

      <TimeSeriesChart
        series={series}
        isLoading={isLoading}
        noDataMsg={selectedCodes.length === 0 ? t('timeSeries.noVars') : t('timeSeries.noData')}
      />
    </div>
  );
}
