'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useTimeSeries } from '@/hooks/useTimeSeries';
import { useTimeRange, rangeToISO } from '@/hooks/useTimeRange';
import { TS_VARS } from '@/lib/constants';
import { VarChips } from './VarChips';
import { TimeSeriesChart } from './TimeSeriesChart';
import { Select } from '@/components/ui/Select';
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

  // Sincroniza el device inicial cuando los datastreams llegan despues del primer render.
  // Es necesario porque useState solo evalua el valor inicial una vez.
  useEffect(() => {
    if (selectedDeviceId === '' && devices.length > 0) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  const [selectedCodes, setSelectedCodes]       = useState<string[]>(['pm2_5']);

  const datastreamIds = selectedCodes
    .map((code) =>
      datastreams.find(
        (d) => d.property_code.toLowerCase() === code && d.sensor_id === selectedDeviceId,
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
        (d) => d.property_code.toLowerCase() === code && d.sensor_id === selectedDeviceId,
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

      <VarChips vars={TS_VARS} selected={selectedCodes} onChange={setSelectedCodes} max={3} />

      <TimeSeriesChart
        series={series}
        isLoading={isLoading}
        noDataMsg={selectedCodes.length === 0 ? t('timeSeries.noVars') : t('timeSeries.noData')}
      />
    </div>
  );
}
