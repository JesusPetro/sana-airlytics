'use client';

import type React from 'react';
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
  fontFamily: 'var(--font-sans, inherit)',
};

const layerToggleStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '4px',
  background: 'var(--color-surface-subtle)',
  borderRadius: '8px',
  padding: '3px',
};

const contaminantSectionStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' };
const contaminantLabelStyle: React.CSSProperties = { fontSize: '12px', color: 'var(--color-text-secondary)', paddingLeft: '2px' };
const contaminantListStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1px' };

const trajectoryRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: '4px',
  borderTop: '1px solid var(--color-border-subtle)',
};
const trajectoryLabelStyle: React.CSSProperties = { fontSize: '12px', color: 'var(--color-text-secondary)' };

const toggleTrackStyle: React.CSSProperties = {
  position: 'absolute',
  top: '2px',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  background: '#fff',
  transition: 'left 0.2s',
};

const toggleSwitchBaseStyle: React.CSSProperties = {
  width: '28px',
  height: '16px',
  borderRadius: '9999px',
  border: 'none',
  cursor: 'pointer',
  position: 'relative',
  transition: 'background 0.2s',
  flexShrink: 0,
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
      <div style={layerToggleStyle}>
        {(['points', 'heatmap'] as LayerMode[]).map((l) => {
          const layerBtnStyle: React.CSSProperties = {
            padding: '4px 0',
            fontSize: '12px',
            fontFamily: 'inherit',
            fontWeight: layer === l ? 600 : 400,
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            background: layer === l ? 'var(--color-surface)' : 'transparent',
            color: layer === l ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            boxShadow: layer === l ? 'var(--shadow-sm)' : 'none',
            transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
          };
          return (
            <button key={l} onClick={() => onLayerChange(l)} style={layerBtnStyle}>
              {t(l)}
            </button>
          );
        })}
      </div>

      {/* Contaminant selector */}
      <div style={contaminantSectionStyle}>
        <span style={contaminantLabelStyle}>{t('contaminant')}</span>
        <div style={contaminantListStyle}>
          {CONTAMINANTS.map((c) => {
            const contBtnStyle: React.CSSProperties = {
              textAlign: 'left',
              padding: '4px 6px',
              fontSize: '12px',
              fontFamily: 'inherit',
              fontWeight: contaminant === c.code ? 600 : 400,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: contaminant === c.code ? 'var(--color-primary-surface)' : 'transparent',
              color: contaminant === c.code ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              transition: 'background 0.12s, color 0.12s',
            };
            return (
              <button key={c.code} onClick={() => onContaminantChange(c.code)} style={contBtnStyle}>
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trajectory toggle */}
      <div style={trajectoryRowStyle}>
        <span style={trajectoryLabelStyle}>{t('trajectory')}</span>
        <button
          role="switch"
          aria-checked={trajectory}
          onClick={() => onTrajectoryChange(!trajectory)}
          style={{ ...toggleSwitchBaseStyle, background: trajectory ? 'var(--color-primary)' : 'var(--color-border)' }}
        >
          <span style={{ ...toggleTrackStyle, left: trajectory ? '14px' : '2px' }} />
        </button>
      </div>
    </div>
  );
}
