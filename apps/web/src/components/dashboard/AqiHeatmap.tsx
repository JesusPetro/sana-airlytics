'use client';

import { useState, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useAqiHeatmap } from '@/hooks/useAqiHeatmap';
import { KPI_SPECS_THRESH } from '@/lib/constants';
import { levelFromValue, colorFromLevel } from '@/lib/aqi';
import type { DatastreamResponse } from '@/types/analytics';

interface Props {
  workspaceId: string | undefined;
  datastreams:  DatastreamResponse[];
}

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HOURS      = Array.from({ length: 24 }, (_, i) => i);
const LEVEL_IDS  = ['good', 'moderate', 'elevated', 'unhealthy', 'critical', 'hazardous'] as const;

interface Tooltip { x: number; y: number; text: string }

export function AqiHeatmap({ workspaceId, datastreams }: Props) {
  const t = useTranslations();
  const [selectedCode, setSelectedCode] = useState(KPI_SPECS_THRESH[0].code);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ds = datastreams.find(d => d.property_code.toLowerCase() === selectedCode);
  const { data: buckets, isLoading } = useAqiHeatmap(workspaceId, ds?.datastream_id);

  const spec = KPI_SPECS_THRESH.find(s => s.code === selectedCode);

  const grid = useMemo(() => {
    const today = new Date();
    today.setSeconds(0, 0);

    const days: { date: Date; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ date: d, label: DAYS_SHORT[d.getDay()] });
    }

    const map = new Map<string, number | null>();
    (buckets ?? []).forEach(b => {
      const dt  = new Date(b.bucket);
      const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}-${dt.getHours()}`;
      map.set(key, b.avg_value);
    });

    return days.map(({ date, label }) => ({
      label,
      hours: HOURS.map(h => {
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${h}`;
        const val = map.get(key);
        if (val == null) return { val: null, color: 'var(--color-surface-2)' };
        const level = levelFromValue(selectedCode, val);
        return { val, color: level ? colorFromLevel(level.id) : 'var(--color-surface-2)' };
      }),
    }));
  }, [buckets, selectedCode]);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>

      {/* Pills */}
      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
        {KPI_SPECS_THRESH.map(s => {
          const active = s.code === selectedCode;
          return (
            <button
              key={s.code}
              onClick={() => setSelectedCode(s.code)}
              style={{
                padding:      '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize:     '11px',
                fontWeight:   600,
                cursor:       'pointer',
                border:       '1px solid var(--color-border)',
                background:   active ? 'var(--color-surface-2)' : 'transparent',
                color:        active ? 'var(--color-text-primary)' : 'var(--color-text-disabled)',
                transition:   'background 120ms, color 120ms',
              }}
            >
              {t(s.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Hour axis — same grid layout as rows so labels align */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ width: 26, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: '2px' }}>
          {HOURS.map(h => (
            <div key={h} style={{ fontSize: '9px', color: 'var(--color-text-disabled)', textAlign: 'center' }}>
              {h % 6 === 0 ? String(h).padStart(2, '0') : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {grid.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width:        26,
              flexShrink:   0,
              fontSize:     '10px',
              color:        'var(--color-text-disabled)',
              fontWeight:   500,
              textAlign:    'right',
              paddingRight: 4,
            }}>
              {row.label}
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: '2px' }}>
              {row.hours.map((cell, hi) => (
                <div
                  key={hi}
                  style={{
                    aspectRatio:  '1',
                    borderRadius: '2px',
                    background:   isLoading ? 'var(--color-surface-2)' : cell.color,
                    opacity:      isLoading ? 0.4 : 1,
                    position:     'relative',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    gsap.to(el, { scale: 1.5, zIndex: 20, duration: 0.12, ease: 'power2.out', overwrite: true });
                    if (cell.val !== null && containerRef.current) {
                      const cr = containerRef.current.getBoundingClientRect();
                      const er = el.getBoundingClientRect();
                      setTooltip({
                        x: er.left + er.width / 2 - cr.left,
                        y: er.top - cr.top - 6,
                        text: `${String(hi).padStart(2, '0')}:00 — ${cell.val.toFixed(1)}${spec?.unit ? ' ' + spec.unit : ''}`,
                      });
                    }
                  }}
                  onMouseLeave={e => {
                    gsap.to(e.currentTarget as HTMLElement, { scale: 1, zIndex: 1, duration: 0.12, ease: 'power2.out', overwrite: true });
                    setTooltip(null);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '9px', color: 'var(--color-text-disabled)', marginRight: 2 }}>
          {t('aqiLevel.good')}
        </span>
        {LEVEL_IDS.map(id => (
          <div
            key={id}
            style={{ width: 10, height: 10, borderRadius: '2px', background: colorFromLevel(id), flexShrink: 0 }}
          />
        ))}
        <span style={{ fontSize: '9px', color: 'var(--color-text-disabled)', marginLeft: 2 }}>
          {t('aqiLevel.hazardous')}
        </span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position:      'absolute',
          left:          tooltip.x,
          top:           tooltip.y,
          transform:     'translate(-50%, -100%)',
          background:    'var(--color-surface-2)',
          border:        '1px solid var(--color-border)',
          borderRadius:  '6px',
          padding:       '4px 8px',
          fontSize:      '11px',
          fontWeight:    500,
          color:         'var(--color-text-primary)',
          whiteSpace:    'nowrap',
          pointerEvents: 'none',
          zIndex:        50,
        }}>
          {tooltip.text}
        </div>
      )}

    </div>
  );
}
