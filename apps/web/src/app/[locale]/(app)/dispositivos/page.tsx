'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useDevices } from '@/hooks/useDevices';
import { useDashboard } from '@/hooks/useDashboard';
import { DevicesTable } from '@/components/devices/DevicesTable';
import { DeviceDetailPanel } from '@/components/devices/DeviceDetailPanel';
import { RegisterDeviceModal } from '@/components/devices/RegisterDeviceModal';
import { EmptyWorkspace } from '@/components/ui/EmptyWorkspace';
import type { DeviceStatusResponse, SensorStatus } from '@/types/sensor';

const STATUS_COLORS: Record<SensorStatus, string> = {
  ACTIVE:   'var(--color-status-online)',
  PENDING:  'var(--color-status-pending)',
  INACTIVE: 'var(--color-status-offline)',
};

const STATUS_LABELS: Record<SensorStatus, string> = {
  ACTIVE:   'Online',
  PENDING:  'Pending',
  INACTIVE: 'Offline',
};

export default function DispositivosPage() {
  const t = useTranslations();
  const { activeWorkspace, isLoading: wsLoading } = useWorkspace();
  const { data: devices = [], isLoading: devLoading } = useDevices(activeWorkspace?.workspace_id);
  const { data: dashData } = useDashboard(activeWorkspace?.workspace_id);

  const [selectedDevice, setSelectedDevice] = useState<DeviceStatusResponse | null>(null);
  const [showModal, setShowModal] = useState(false);

  if (wsLoading) return <EmptyWorkspace msg={t('common.loading')} />;
  if (!activeWorkspace) return <EmptyWorkspace msg={t('dashboard.noWorkspace')} />;

  const counts = devices.reduce(
    (acc, d) => { acc[d.status] = (acc[d.status] ?? 0) + 1; return acc; },
    {} as Record<SensorStatus, number>,
  );

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{
          fontSize: '22px',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: 'var(--color-text-primary)',
          margin: 0,
        }}>
          {t('devices.title')}
        </h1>

        {/* Count chip */}
        {!devLoading && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: '24px',
            padding: '0 10px',
            borderRadius: '9999px',
            background: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border-subtle)',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}>
            {devices.length}
          </span>
        )}

        {/* Status chips */}
        {!devLoading && (['ACTIVE', 'PENDING', 'INACTIVE'] as SensorStatus[]).map((s) => {
          const count = counts[s] ?? 0;
          if (!count) return null;
          return (
            <span key={s} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              height: '24px',
              padding: '0 10px',
              borderRadius: '9999px',
              background: `color-mix(in oklab, ${STATUS_COLORS[s]} 10%, transparent)`,
              border: `1px solid color-mix(in oklab, ${STATUS_COLORS[s]} 30%, transparent)`,
              fontSize: '11px',
              fontWeight: 500,
              color: STATUS_COLORS[s],
            }}>
              <span style={{
                width: '6px', height: '6px',
                borderRadius: '50%',
                background: STATUS_COLORS[s],
                flexShrink: 0,
              }} />
              {count} {STATUS_LABELS[s]}
            </span>
          );
        })}

        <div style={{ flex: 1 }} />

        {/* Claim button */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '36px',
            padding: '0 16px',
            borderRadius: '8px',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 160ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-dark)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-primary)')}
        >
          <Plus size={15} />
          {t('devices.claimDevice')}
        </button>
      </div>

      {/* Table */}
      <DevicesTable
        devices={devices}
        dashData={dashData}
        isLoading={devLoading}
        onSelectDevice={setSelectedDevice}
        selectedDeviceId={selectedDevice?.device_id ?? null}
      />

      {selectedDevice && (
        <DeviceDetailPanel
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}

      {showModal && (
        <RegisterDeviceModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
