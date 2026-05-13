'use client';

import type React from 'react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface CreateZoneFormProps {
  lat: number;
  lon: number;
  onRadiusChange: (r: number) => void;
  onConfirm: (name: string, radius: number) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const MIN_RADIUS = 50;
const MAX_RADIUS = 5000;
const DEFAULT_RADIUS = 500;

export function CreateZoneForm({
  lat,
  lon,
  onRadiusChange,
  onConfirm,
  onCancel,
  isLoading,
}: CreateZoneFormProps) {
  const t = useTranslations('zones');
  const [name, setName]     = useState('');
  const [radius, setRadius] = useState(DEFAULT_RADIUS);

  function handleRadiusChange(val: number) {
    setRadius(val);
    onRadiusChange(val);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim(), radius);
  }

  const panelStyle: React.CSSProperties = {
    padding:    '16px',
    display:    'flex',
    flexDirection: 'column',
    gap:        '14px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize:   '11px',
    fontWeight: 600,
    color:      'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width:        '100%',
    padding:      '8px 10px',
    borderRadius: '6px',
    border:       '1px solid var(--color-border)',
    background:   'var(--color-surface)',
    color:        'var(--color-text-primary)',
    fontSize:     '13px',
    outline:      'none',
    boxSizing:    'border-box',
  };

  const coordsStyle: React.CSSProperties = {
    fontSize:   '11px',
    color:      'var(--color-text-secondary)',
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <form onSubmit={handleSubmit} style={panelStyle}>
      <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
          {t('createTitle')}
        </div>
        <div style={coordsStyle}>
          {lat.toFixed(5)}, {lon.toFixed(5)}
        </div>
      </div>

      <div>
        <label style={labelStyle}>{t('fieldName')}</label>
        <input
          style={inputStyle}
          type="text"
          placeholder={t('fieldNamePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={labelStyle}>{t('fieldRadius')}</label>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {radius} {t('radiusUnit')}
          </span>
        </div>
        <input
          type="range"
          min={MIN_RADIUS}
          max={MAX_RADIUS}
          step={50}
          value={radius}
          onChange={(e) => handleRadiusChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--color-accent)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{MIN_RADIUS}m</span>
          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{MAX_RADIUS}m</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, padding: '8px', borderRadius: '6px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)', color: 'var(--color-text-secondary)',
            fontSize: '13px', cursor: 'pointer',
          }}
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={!name.trim() || isLoading}
          style={{
            flex: 1, padding: '8px', borderRadius: '6px',
            border: 'none', background: 'var(--color-accent)',
            color: '#fff', fontSize: '13px', fontWeight: 600,
            cursor: !name.trim() || isLoading ? 'not-allowed' : 'pointer',
            opacity: !name.trim() || isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? t('creating') : t('createBtn')}
        </button>
      </div>
    </form>
  );
}
