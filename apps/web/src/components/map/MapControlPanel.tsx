'use client';

import { useTranslations } from 'next-intl';

type LayerMode = 'points' | 'heatmap';
type ContaminantCode = 'pm2_5' | 'pm10' | 'co2' | 'nox_index';

interface MapControlPanelProps {
  layer: LayerMode;
  onLayerChange: (l: LayerMode) => void;
  contaminant: ContaminantCode;
  onContaminantChange: (c: ContaminantCode) => void;
  trajectory: boolean;
  onTrajectoryChange: (v: boolean) => void;
}

const CONTAMINANTS: { code: ContaminantCode; label: string }[] = [
  { code: 'pm2_5',     label: 'PM2.5' },
  { code: 'pm10',      label: 'PM10' },
  { code: 'co2',       label: 'CO₂' },
  { code: 'nox_index', label: 'NOx' },
];

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  left: '12px',
  zIndex: 1000,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  boxShadow: 'var(--shadow-md)',
  padding: '10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minWidth: '148px',
};

export function MapControlPanel({
  layer,
  onLayerChange,
  contaminant,
  onContaminantChange,
  trajectory,
  onTrajectoryChange,
}: MapControlPanelProps) {
  const t = useTranslations('map');

  return (
    <div style={panelStyle}>
      {/* Layer toggle */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px',
        background: 'var(--color-surface-subtle)',
        borderRadius: '8px',
        padding: '3px',
      }}>
        {(['points', 'heatmap'] as LayerMode[]).map((l) => (
          <button
            key={l}
            onClick={() => onLayerChange(l)}
            style={{
              padding: '4px 0',
              fontSize: '11px',
              fontWeight: layer === l ? 600 : 400,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: layer === l ? 'var(--color-surface)' : 'transparent',
              color: layer === l ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              boxShadow: layer === l ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {t(l)}
          </button>
        ))}
      </div>

      {/* Contaminant selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', paddingLeft: '2px' }}>
          {t('contaminant')}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {CONTAMINANTS.map((c) => (
            <button
              key={c.code}
              onClick={() => onContaminantChange(c.code)}
              style={{
                textAlign: 'left',
                padding: '4px 6px',
                fontSize: '11px',
                fontWeight: contaminant === c.code ? 600 : 400,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: contaminant === c.code ? 'var(--color-primary-surface)' : 'transparent',
                color: contaminant === c.code ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                transition: 'all 0.12s',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trajectory toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '4px',
          borderTop: '1px solid var(--color-border-subtle)',
        }}
      >
        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
          {t('trajectory')}
        </span>
        <button
          role="switch"
          aria-checked={trajectory}
          onClick={() => onTrajectoryChange(!trajectory)}
          style={{
            width: '28px',
            height: '16px',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            background: trajectory ? 'var(--color-primary)' : 'var(--color-border)',
            position: 'relative',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute',
            top: '2px',
            left: trajectory ? '14px' : '2px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>
    </div>
  );
}
