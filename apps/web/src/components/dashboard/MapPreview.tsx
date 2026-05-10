'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useState, useMemo, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Maximize2 } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useDevices } from '@/hooks/useDevices';
import { useDashboard } from '@/hooks/useDashboard';
import { levelFromValue } from '@/lib/aqi';
import type { DeviceStatusResponse } from '@/types/sensor';

const MiniMap = dynamic(
  () => import('./MiniMapInner').then((m) => m.MiniMapInner),
  {
    ssr: false,
    loading: () => (
      <div style={{
        width: '100%', height: '100%',
        background: 'var(--color-surface-2)',
        animation: 'skelPulse 1.5s ease-in-out infinite',
      }} />
    ),
  },
);

export function MapPreview() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const { activeWorkspace } = useWorkspace();
  const [heatmap, setHeatmap] = useState(false);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const pillRefs = [useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null)];

  useEffect(() => {
    const activeBtn = pillRefs[heatmap ? 1 : 0].current;
    const indicator = indicatorRef.current;
    if (!activeBtn || !indicator) return;
    gsap.to(indicator, {
      x: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
      duration: 0.22,
      ease: 'power2.out',
    });
  }, [heatmap]);

  const { data: devices = [] } = useDevices(activeWorkspace?.workspace_id);
  const { data: dashData } = useDashboard(activeWorkspace?.workspace_id);

  const pm2_5Map = useMemo(() => {
    const m: Record<string, number | null> = {};
    for (const d of devices) {
      m[d.device_id] = dashData['pm2_5']?.latestValue ?? null;
    }
    return m;
  }, [devices, dashData]);

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>
          {t('map.title')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Points / Heatmap pill toggle — GSAP animated indicator */}
          <div style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '9999px',
            padding: '3px',
            gap: '2px',
          }}>
            {/* Sliding indicator */}
            <span
              ref={indicatorRef}
              style={{
                position: 'absolute',
                top: '3px',
                left: '3px',
                height: 'calc(100% - 6px)',
                borderRadius: '9999px',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-sm)',
                pointerEvents: 'none',
                width: '56px',
              }}
            />
            {([false, true] as const).map((isHeat, i) => (
              <button
                key={String(isHeat)}
                ref={pillRefs[i]}
                onClick={() => setHeatmap(isHeat)}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  padding: '0 12px',
                  height: '26px',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: heatmap === isHeat ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {isHeat ? t('map.heatmap') : t('map.points')}
              </button>
            ))}
          </div>
          <button
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
              const x = Math.round(rect.left + rect.width / 2);
              const y = Math.round(rect.top + rect.height / 2);
              document.documentElement.style.setProperty('--vt-x', `${x}px`);
              document.documentElement.style.setProperty('--vt-y', `${y}px`);
              if ('startViewTransition' in document) {
                (document as any).startViewTransition(() => router.push(`/${locale}/mapa`));
              } else {
                router.push(`/${locale}/mapa`);
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontFamily: 'inherit',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            <Maximize2 size={13} />
            {t('map.expand')}
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ height: '260px' }}>
        <MiniMap devices={devices} pm2_5Map={pm2_5Map} heatmap={heatmap} />
      </div>
    </div>
  );
}
