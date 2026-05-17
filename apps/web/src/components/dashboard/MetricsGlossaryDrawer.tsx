'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  open: boolean;
  onClose: () => void;
}

type MetricType = 'atmospheric' | 'index' | 'meteorological';

interface MetricEntry {
  key:  string;
  type: MetricType;
  code: string;
  icon: React.ReactNode;
}

const TYPE_COLOR: Record<MetricType, string> = {
  atmospheric:    'var(--color-primary)',
  index:          'var(--color-accent)',
  meteorological: 'var(--color-accent-teal)',
};

const TYPE_BG: Record<MetricType, string> = {
  atmospheric:    'color-mix(in srgb, var(--color-primary) 10%, transparent)',
  index:          'color-mix(in srgb, var(--color-accent) 10%, transparent)',
  meteorological: 'color-mix(in srgb, var(--color-accent-teal) 10%, transparent)',
};

/* ── Unique icons per metric ─────────────────────────────── */
const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    {children}
  </svg>
);

const METRICS: MetricEntry[] = [
  {
    key: 'pm2_5', type: 'atmospheric', code: 'PM2.5',
    icon: (
      // Fine scattered dots — many, tiny, random
      <Icon>
        <circle cx="4"  cy="5"  r="1.2" fill="currentColor" opacity="0.5" />
        <circle cx="9"  cy="3"  r="0.9" fill="currentColor" opacity="0.8" />
        <circle cx="15" cy="4"  r="1.5" fill="currentColor" />
        <circle cx="7"  cy="10" r="1"   fill="currentColor" opacity="0.6" />
        <circle cx="13" cy="9"  r="1.3" fill="currentColor" opacity="0.7" />
        <circle cx="3"  cy="15" r="0.8" fill="currentColor" opacity="0.5" />
        <circle cx="11" cy="15" r="1.5" fill="currentColor" opacity="0.9" />
        <circle cx="17" cy="13" r="1"   fill="currentColor" opacity="0.4" />
        <circle cx="6"  cy="17" r="0.7" fill="currentColor" opacity="0.6" />
      </Icon>
    ),
  },
  {
    key: 'pm10', type: 'atmospheric', code: 'PM10',
    icon: (
      // Fewer, larger dots — coarser
      <Icon>
        <circle cx="6"  cy="7"  r="3.5" fill="currentColor" opacity="0.6" />
        <circle cx="14" cy="6"  r="4"   fill="currentColor" opacity="0.85" />
        <circle cx="9"  cy="14" r="3.5" fill="currentColor" opacity="0.5" />
      </Icon>
    ),
  },
  {
    key: 'pm1_pm4', type: 'atmospheric', code: 'PM1–4',
    icon: (
      // Size spectrum: small → large left to right
      <Icon>
        <circle cx="4"  cy="11" r="1"   fill="currentColor" />
        <circle cx="9"  cy="11" r="2"   fill="currentColor" opacity="0.75" />
        <circle cx="15" cy="11" r="3.5" fill="currentColor" opacity="0.5" />
        <line x1="2" y1="16" x2="18" y2="16" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
        <line x1="4" y1="14" x2="4"  y2="16" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
        <line x1="9" y1="14" x2="9"  y2="16" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
        <line x1="15" y1="14" x2="15" y2="16" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      </Icon>
    ),
  },
  {
    key: 'co2', type: 'atmospheric', code: 'CO₂',
    icon: (
      // Molecule: central C, two flanking O
      <Icon>
        <circle cx="10" cy="10" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="2.5" cy="10" r="2"  fill="currentColor" opacity="0.7" />
        <circle cx="17.5" cy="10" r="2" fill="currentColor" opacity="0.7" />
        <line x1="4.5" y1="10" x2="6.5"  y2="10" stroke="currentColor" strokeWidth="1.5" />
        <line x1="13.5" y1="10" x2="15.5" y2="10" stroke="currentColor" strokeWidth="1.5" />
      </Icon>
    ),
  },
  {
    key: 'voc', type: 'index', code: 'VOC',
    icon: (
      // Organic vapor — wavy rising lines
      <Icon>
        <path d="M4 16 Q6 12 8 16 Q10 20 12 16 Q14 12 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <path d="M4 11 Q6  7 8 11 Q10 15 12 11 Q14  7 16 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        <path d="M4  6 Q6  2 8  6 Q10 10 12  6 Q14  2 16  6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </Icon>
    ),
  },
  {
    key: 'nox', type: 'index', code: 'NOx',
    icon: (
      // Reactive burst — rays from center
      <Icon>
        <circle cx="10" cy="10" r="2.5" fill="currentColor" opacity="0.25" />
        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
        <line x1="10" y1="2"  x2="10" y2="5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="10" y1="14.5" x2="10" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2"  y1="10" x2="5.5" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14.5" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4.3" y1="4.3"   x2="6.8" y2="6.8"   stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <line x1="13.2" y1="13.2" x2="15.7" y2="15.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <line x1="15.7" y1="4.3"  x2="13.2" y2="6.8"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <line x1="6.8"  y1="13.2" x2="4.3"  y2="15.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      </Icon>
    ),
  },
  {
    key: 'temp_hum', type: 'meteorological', code: 'T & H',
    icon: (
      // Thermometer + water drop side by side
      <Icon>
        <rect x="8" y="2" width="4" height="10" rx="2" fill="currentColor" opacity="0.25" />
        <rect x="9" y="4" width="2" height="7"  rx="1" fill="currentColor" opacity="0.8" />
        <circle cx="10" cy="14" r="3" fill="currentColor" opacity="0.6" />
        <path d="M15 5 Q17 2 19 5 Q19 8 17 8 Q15 8 15 5Z" fill="currentColor" opacity="0.8" />
      </Icon>
    ),
  },
];

export function MetricsGlossaryDrawer({ open, onClose }: Props) {
  const t = useTranslations('glossary');

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position:       'fixed',
          inset:          0,
          background:     'rgba(7, 11, 20, 0.45)',
          backdropFilter: 'blur(2px)',
          zIndex:         200,
          opacity:        open ? 1 : 0,
          pointerEvents:  open ? 'auto' : 'none',
          transition:     'opacity 260ms ease',
        }}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        style={{
          position:      'fixed',
          top:           0,
          right:         0,
          height:        '100dvh',
          width:         'min(420px, 100vw)',
          background:    'var(--color-surface)',
          borderLeft:    '1px solid var(--color-border)',
          boxShadow:     'var(--shadow-lg)',
          zIndex:        201,
          display:       'flex',
          flexDirection: 'column',
          transform:     open ? 'translateX(0)' : 'translateX(100%)',
          transition:    'transform 280ms cubic-bezier(0.32, 0.72, 0, 1)',
          overflowY:     'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '20px 20px 16px',
          borderBottom:   '1px solid var(--color-border-subtle)',
          flexShrink:     0,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: 'var(--color-text-disabled)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              SANA
            </p>
            <h2 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
              {t('title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              width:          '32px',
              height:         '32px',
              borderRadius:   '8px',
              border:         '1px solid var(--color-border)',
              background:     'transparent',
              cursor:         'pointer',
              color:          'var(--color-text-secondary)',
              flexShrink:     0,
              transition:     'background 140ms ease, color 140ms ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'var(--color-surface-2)';
              el.style.color      = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'transparent';
              el.style.color      = 'var(--color-text-secondary)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px 28px' }}>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            {t('subtitle')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {METRICS.map(({ key, type, code, icon }) => (
              <div
                key={key}
                style={{
                  background:   'var(--color-surface-subtle)',
                  border:       '1px solid var(--color-border-subtle)',
                  borderRadius: '12px',
                  padding:      '14px 16px 16px',
                  display:      'flex',
                  flexDirection: 'column',
                  gap:          '10px',
                }}
              >
                {/* Card header: icon + code + type label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width:          '38px',
                    height:         '38px',
                    borderRadius:   '10px',
                    background:     TYPE_BG[type],
                    color:          TYPE_COLOR[type],
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    flexShrink:     0,
                  }}>
                    {icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize:      '15px',
                        fontWeight:    700,
                        color:         TYPE_COLOR[type],
                        letterSpacing: '-0.02em',
                        lineHeight:    1,
                      }}>
                        {code}
                      </span>
                      <span style={{
                        fontSize:  '10px',
                        fontWeight: 600,
                        color:     'var(--color-text-disabled)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase' as const,
                      }}>
                        {t(`types.${type}`)}
                      </span>
                    </div>
                    <p style={{
                      margin:        '3px 0 0',
                      fontSize:      '12px',
                      fontWeight:    600,
                      color:         'var(--color-text-primary)',
                      letterSpacing: '-0.01em',
                      lineHeight:    1.3,
                    }}>
                      {t(`metrics.${key}.name`)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p style={{
                  margin:     0,
                  fontSize:   '12px',
                  color:      'var(--color-text-secondary)',
                  lineHeight: 1.65,
                }}>
                  {t(`metrics.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
