'use client';

import { useTranslations } from 'next-intl';

type ContaminantCode = 'pm2_5' | 'pm10' | 'co2' | 'nox_index';

interface LegendEntry {
  labelKey: string;
  color: string;
}

const LEGEND: LegendEntry[] = [
  { labelKey: 'aqiLevel.good',      color: 'var(--color-aqi-good)' },
  { labelKey: 'aqiLevel.moderate',  color: 'var(--color-aqi-moderate)' },
  { labelKey: 'aqiLevel.elevated',  color: 'var(--color-aqi-elevated)' },
  { labelKey: 'aqiLevel.unhealthy', color: 'var(--color-aqi-unhealthy)' },
  { labelKey: 'aqiLevel.critical',  color: 'var(--color-aqi-critical)' },
  { labelKey: 'aqiLevel.hazardous', color: 'var(--color-aqi-hazardous)' },
];

const CONTAMINANT_LABEL: Record<ContaminantCode, string> = {
  pm2_5:     'PM2.5 (µg/m³)',
  pm10:      'PM10 (µg/m³)',
  co2:       'CO₂ (ppm)',
  nox_index: 'NOx Index',
};

interface MapLegendProps {
  contaminant: ContaminantCode;
}

export function MapLegend({ contaminant }: MapLegendProps) {
  const t = useTranslations();

  return (
    <div style={{
      position: 'absolute',
      bottom: '24px',
      right: '12px',
      zIndex: 1000,
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '10px',
      boxShadow: 'var(--shadow-md)',
      padding: '10px 12px',
      minWidth: '130px',
    }}>
      <div style={{
        fontSize: '10px',
        fontWeight: 600,
        color: 'var(--color-text-secondary)',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        {CONTAMINANT_LABEL[contaminant]}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {LEGEND.map((entry) => (
          <div key={entry.labelKey} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: entry.color,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: '11px', color: 'var(--color-text-primary)' }}>
              {t(entry.labelKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
