'use client';

import type React from 'react';
import { useTranslations } from 'next-intl';

type ContaminantCode = 'pm2_5' | 'pm10' | 'co2' | 'nox_index';

const LEVELS = [
  { labelKey: 'aqiLevel.good',      color: '#10B981' },
  { labelKey: 'aqiLevel.moderate',  color: '#3B82F6' },
  { labelKey: 'aqiLevel.elevated',  color: '#8B5CF6' },
  { labelKey: 'aqiLevel.unhealthy', color: '#EC4899' },
  { labelKey: 'aqiLevel.critical',  color: '#EF4444' },
  { labelKey: 'aqiLevel.hazardous', color: '#991B1B' },
] as const;

const GRADIENT = `linear-gradient(to right, ${LEVELS.map(l => l.color).join(', ')})`;

const CONTAMINANT_LABEL: Record<ContaminantCode, string> = {
  pm2_5:     'PM2.5 · µg/m³',
  pm10:      'PM10 · µg/m³',
  co2:       'CO₂ · ppm',
  nox_index: 'NOx Index',
};

interface MapLegendProps {
  contaminant: ContaminantCode;
}

const legendStyle: React.CSSProperties = {
  position:   'absolute',
  bottom:     '24px',
  right:      '12px',
  zIndex:     20,
  background: 'var(--color-surface)',
  border:     '1px solid var(--color-border)',
  borderRadius: '12px',
  boxShadow:  'var(--shadow-md)',
  padding:    '10px 12px 8px',
  width:      '220px',
};

const legendContaminantLabelStyle: React.CSSProperties = {
  fontSize:      '12px',
  fontWeight:    600,
  color:         'var(--color-text-secondary)',
  marginBottom:  '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tickLabelStyle: React.CSSProperties = {
  fontSize:  '12px',
  fontWeight: 500,
  color:     'var(--color-text-secondary)',
  textAlign: 'center',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
};

export function MapLegend({ contaminant }: MapLegendProps) {
  const t = useTranslations();

  return (
    <div style={legendStyle}>
      {/* Contaminant label */}
      <div style={legendContaminantLabelStyle}>
        {CONTAMINANT_LABEL[contaminant]}
      </div>

      {/* Gradient bar */}
      <div style={{
        height:       '8px',
        borderRadius: '99px',
        background:   GRADIENT,
        marginBottom: '5px',
      }} />

      {/* Tick marks */}
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        {LEVELS.map((level) => (
          <div
            key={level.labelKey}
            style={{
              display:    'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap:        '2px',
              flex:       1,
            }}
          >
            <div style={{
              width:        '1px',
              height:       '4px',
              background:   level.color,
              borderRadius: '1px',
              opacity:      0.7,
            }} />
            <span style={tickLabelStyle}>
              {t(level.labelKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
