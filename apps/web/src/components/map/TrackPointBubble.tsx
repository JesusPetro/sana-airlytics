'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { X } from 'lucide-react';
import type { Snapshot } from '@/lib/api/devices';
import { levelFromValue } from '@/lib/aqi';

interface Props {
  snapshot: Snapshot;
  deviceCode: string;
  onClose: () => void;
}

export function TrackPointBubble({ snapshot, deviceCode, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { opacity: 0, scale: 0.9, y: 6 },
      { opacity: 1, scale: 1, y: 0, duration: 0.18, ease: 'power2.out' },
    );
  }, []);

  const time = new Date(snapshot.phenomenon_time).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div ref={ref} style={{
      width: '240px',
      fontFamily: 'inherit',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 10px 8px',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {deviceCode}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {time}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '20px', height: '20px',
            borderRadius: '5px', border: 'none',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-disabled)',
            transition: 'background 140ms, color 140ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-subtle)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-disabled)'; }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Variables */}
      <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {snapshot.variables.map((v) => {
          const code = v.property_code.toLowerCase();
          const level = v.result != null ? levelFromValue(code, v.result) : null;
          const color = level?.color ?? null;

          return (
            <div key={v.property_code} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 6px',
              borderRadius: '6px',
              background: color
                ? `color-mix(in oklab, ${color} 10%, var(--color-surface-subtle))`
                : 'var(--color-surface-subtle)',
              borderLeft: color ? `3px solid ${color}` : '3px solid transparent',
            }}>
              {/* Dot de nivel */}
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                flexShrink: 0,
                background: color ?? 'var(--color-text-disabled)',
              }} />

              <span style={{
                flex: 1,
                fontSize: '10px',
                color: 'var(--color-text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {v.property_name}
              </span>

              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: color ?? 'var(--color-text-disabled)',
                flexShrink: 0,
              }}>
                {v.result != null ? `${v.result} ${v.unit_symbol}` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
