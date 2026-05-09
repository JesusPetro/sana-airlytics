'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { X } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { StatusDot } from '@/components/ui/StatusDot';
import { formatRelative, formatValue } from '@/lib/format';
import { KPI_SPECS_THRESH, KPI_SPECS_NOTHRESH } from '@/lib/constants';
import type { DeviceStatusResponse } from '@/types/sensor';
import type { DashboardEntry } from '@/hooks/useDashboard';

gsap.registerPlugin(useGSAP);

const MiniMapInner = dynamic(
  () => import('@/components/dashboard/MiniMapInner').then((m) => m.MiniMapInner),
  { ssr: false },
);

const ALL_SPECS = [...KPI_SPECS_THRESH, ...KPI_SPECS_NOTHRESH];

interface DeviceDetailPanelProps {
  device: DeviceStatusResponse;
  dashData: Record<string, DashboardEntry>;
  onClose: () => void;
}

export function DeviceDetailPanel({ device, dashData, onClose }: DeviceDetailPanelProps) {
  const t = useTranslations();
  const locale = useLocale();
  const panelRef    = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closing     = useRef(false);

  useGSAP(() => {
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
    gsap.fromTo(panelRef.current,    { x: 400 },     { x: 0,       duration: 0.32, ease: 'power3.out' });
  }, {});

  function handleClose() {
    if (closing.current) return;
    closing.current = true;
    gsap.to(panelRef.current,    { x: 400, duration: 0.24, ease: 'power3.in' });
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: onClose });
  }

  const pm2_5Map: Record<string, number | null> = {
    [device.device_id]: dashData['pm2_5']?.latestValue ?? null,
  };

  function readingForDevice(code: string): number | null {
    const entry = dashData[code];
    if (!entry) return null;
    if (entry.datastream.sensor_code !== device.code) return null;
    return entry.latestValue;
  }

  const hasLocation = device.latitude != null && device.longitude != null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.25)',
          zIndex: 200,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div ref={panelRef} style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: '380px',
        zIndex: 201,
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <StatusDot status={device.status} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>
                {device.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontFamily: 'monospace', marginTop: '2px' }}>
                {device.code}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-secondary)', padding: '4px',
              borderRadius: '6px', display: 'flex',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Info general */}
          <Section title={t('devices.deviceInfo')}>
            <InfoRow label={t('devices.model')}    value={device.model} />
            <InfoRow label={t('devices.status')}   value={device.status} />
            {device.site_type && <InfoRow label={t('devices.siteType')} value={device.site_type} />}
            <InfoRow
              label={t('devices.lastSeen')}
              value={device.last_seen ? formatRelative(device.last_seen, locale) : t('devices.never')}
            />
            <InfoRow
              label={t('devices.samplingInterval')}
              value={`${device.sampling_interval_seconds} ${t('devices.seconds')}`}
            />
            <InfoRow
              label={t('devices.transmissionInterval')}
              value={`${device.transmission_interval_seconds} ${t('devices.seconds')}`}
            />
          </Section>

          {/* Mini mapa */}
          <Section title={t('devices.location')}>
            {hasLocation ? (
              <div style={{ height: '160px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border-subtle)' }}>
                <MiniMapInner
                  devices={[device]}
                  pm2_5Map={pm2_5Map}
                  heatmap={false}
                />
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                {t('devices.noLocation')}
              </p>
            )}
          </Section>

          {/* Lecturas actuales */}
          <Section title={t('devices.currentReadings')}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {ALL_SPECS.map((spec) => {
                const val = readingForDevice(spec.code);
                return (
                  <div key={spec.code} style={{
                    background: 'var(--color-surface-subtle)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>
                      {t(spec.labelKey as Parameters<typeof t>[0])}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {formatValue(spec.code, val)}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Identificadores MQTT */}
          <Section title={t('devices.mqttIdentifiers')}>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>
              {t('devices.mqttNote')}
            </p>
            <InfoRow label={t('devices.deviceId')} value={device.device_id} mono />
            <InfoRow label={t('devices.code')}     value={device.code} mono />
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '5px 0', borderBottom: '1px solid var(--color-border-subtle)',
      gap: '12px',
    }}>
      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)',
        fontFamily: mono ? 'monospace' : undefined,
        wordBreak: 'break-all', textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  );
}
