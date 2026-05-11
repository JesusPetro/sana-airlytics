'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { X } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { formatRelative, formatValue } from '@/lib/format';
import { KPI_SPECS_THRESH, KPI_SPECS_NOTHRESH } from '@/lib/constants';
import { useDeviceLatestSnapshot } from '@/hooks/useDeviceLatestSnapshot';
import { useWorkspace } from '@/context/WorkspaceContext';
import type { DeviceStatusResponse } from '@/types/sensor';

gsap.registerPlugin(useGSAP);

const MiniMapInner = dynamic(
  () => import('@/components/dashboard/MiniMapInner').then((m) => m.MiniMapInner),
  { ssr: false },
);

const ALL_SPECS = [...KPI_SPECS_THRESH, ...KPI_SPECS_NOTHRESH];

interface DeviceDetailPanelProps {
  device: DeviceStatusResponse;
  onClose: () => void;
}

export function DeviceDetailPanel({ device, onClose }: DeviceDetailPanelProps) {
  const t = useTranslations();
  const locale = useLocale();
  const panelRef    = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closing     = useRef(false);

  const { activeWorkspace } = useWorkspace();
  const { data: snapshot, isFetching: snapshotLoading, refetch: refetchSnapshot } =
    useDeviceLatestSnapshot(device.device_id, activeWorkspace?.workspace_id);

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

  const snapshotMap = Object.fromEntries(
    (snapshot?.variables ?? []).map((v) => [v.property_code.toLowerCase(), v.result]),
  ) as Record<string, number | null>;

  const pm2_5Map: Record<string, number | null> = {
    [device.device_id]: snapshotMap['pm2_5'] ?? null,
  };

  function readingFromSnapshot(code: string): number | null {
    return snapshotMap[code] ?? null;
  }

  const hasLocation = device.latitude != null && device.longitude != null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 'var(--topbar-h)', left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.25)',
          zIndex: 200,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div ref={panelRef} style={{
        position: 'fixed',
        top: 'var(--topbar-h)', right: 0, bottom: 0,
        width: '380px',
        zIndex: 201,
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '4px 8px',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink: 0,
        }}>
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

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
          {/* Info general */}
          <Section title={t('devices.deviceInfo')}>
            <InfoRow label={t('devices.model')}    value={device.model} />
            <InfoRow label={t('devices.status')}   value={device.status} />
            {device.site_type && <InfoRow label={t('devices.siteType')} value={device.site_type} />}
            <InfoRow
              label={t('devices.lastSeen')}
              value={
                device.last_seen
                  ? formatRelative(device.last_seen, locale)
                  : snapshot?.phenomenon_time
                    ? formatRelative(snapshot.phenomenon_time, locale)
                    : t('devices.never')
              }
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
          <div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {t('devices.currentReadings')}
              </div>
            </div>
            {snapshot?.phenomenon_time && (
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span>{new Date(snapshot.phenomenon_time).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <span style={{ opacity: 0.6 }}>·</span>
                <span>{formatRelative(snapshot.phenomenon_time, locale)}</span>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {ALL_SPECS.map((spec) => {
                const val = readingFromSnapshot(spec.code);
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
          </div>

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
