'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useTimeRange, rangeToISO } from '@/hooks/useTimeRange';
import { DevicesTable } from '@/components/devices/DevicesTable';
import { DeviceDetailPanel } from '@/components/devices/DeviceDetailPanel';
import { RegisterDeviceModal } from '@/components/devices/RegisterDeviceModal';
import { EmptyWorkspace } from '@/components/ui/EmptyWorkspace';
import type { DeviceStatusResponse } from '@/types/sensor';

export default function DispositivosPage() {
  const t = useTranslations();
  const { activeWorkspace, isLoading: wsLoading } = useWorkspace();
  const { range } = useTimeRange();
  const { from, to } = rangeToISO(range);

  const { data: dashData } = useDashboard(activeWorkspace?.workspace_id, from, to);

  const [selectedDevice, setSelectedDevice] = useState<DeviceStatusResponse | null>(null);
  const [showModal, setShowModal] = useState(false);

  if (wsLoading) return <EmptyWorkspace msg={t('common.loading')} />;
  if (!activeWorkspace) return <EmptyWorkspace msg={t('dashboard.noWorkspace')} />;

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
        {t('devices.title')}
      </h1>

      <DevicesTable
        onSelectDevice={setSelectedDevice}
        onClaimDevice={() => setShowModal(true)}
      />

      {selectedDevice && (
        <DeviceDetailPanel
          device={selectedDevice}
          dashData={dashData}
          onClose={() => setSelectedDevice(null)}
        />
      )}

      {showModal && (
        <RegisterDeviceModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
