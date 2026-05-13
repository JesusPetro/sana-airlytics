'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { X, Search, CheckCircle } from 'lucide-react';
import { StatusDot } from '@/components/ui/StatusDot';
import { useWorkspace } from '@/context/WorkspaceContext';
import { findDeviceByCode, claimDevice } from '@/lib/api/devices';
import { ApiRequestError } from '@/lib/api/client';
import type { DeviceStatusResponse } from '@/types/sensor';

interface RegisterDeviceModalProps {
  onClose: () => void;
}

type Step = 'search' | 'confirm' | 'success';

const backdropStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.4)',
  zIndex: 40,
  backdropFilter: 'blur(4px)',
};

const modalStyle: React.CSSProperties = {
  position: 'fixed',
  top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 40,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '14px',
  boxShadow: 'var(--shadow-lg)',
  width: '440px',
  maxWidth: 'calc(100vw - 32px)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '18px 20px 14px',
  borderBottom: '1px solid var(--color-border-subtle)',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--color-text-secondary)', display: 'flex',
  padding: '4px', borderRadius: '6px',
};

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '8px 12px', fontSize: '13px',
  background: 'var(--color-surface-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px', color: 'var(--color-text-primary)',
  fontFamily: 'monospace',
};

const deviceCardStyle: React.CSSProperties = {
  background: 'var(--color-surface-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '14px 16px',
  display: 'flex', flexDirection: 'column', gap: '8px',
};

const mqttCardStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-surface-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '12px 14px',
  display: 'flex', flexDirection: 'column', gap: '8px',
};

const footerStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'flex-end', gap: '8px',
  padding: '14px 20px',
  borderTop: '1px solid var(--color-border-subtle)',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '7px 16px', fontSize: '13px',
  background: 'var(--color-surface-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px', cursor: 'pointer',
  color: 'var(--color-text-primary)',
};

export function RegisterDeviceModal({ onClose }: RegisterDeviceModalProps) {
  const t = useTranslations('devices');
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('search');
  const [code, setCode] = useState('');
  const [found, setFound] = useState<DeviceStatusResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const claimMutation = useMutation({
    mutationFn: () => claimDevice(found!.code, activeWorkspace!.workspace_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices', activeWorkspace?.workspace_id] });
      queryClient.removeQueries({ queryKey: ['datastreams', activeWorkspace?.workspace_id] });
      setStep('success');
    },
  });

  async function handleSearch() {
    if (!code.trim()) return;
    setSearchError(null);
    setIsSearching(true);
    try {
      const device = await findDeviceByCode(code.trim());
      if (device.status !== 'PENDING') {
        setSearchError(t('alreadyClaimed'));
        setFound(null);
      } else {
        setFound(device);
        setStep('confirm');
      }
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) {
        setSearchError(t('notFound'));
      } else {
        setSearchError(t('searchError'));
      }
      setFound(null);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        role="presentation"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        style={backdropStyle}
      />

      {/* Modal */}
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>
            {t('claimDevice')}
          </span>
          <button
            onClick={onClose}
            style={closeButtonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>

          {/* STEP: search */}
          {(step === 'search' || step === 'confirm') && (
            <>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                {t('searchByCode')}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setSearchError(null); setFound(null); if (step === 'confirm') setStep('search'); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('searchPlaceholder')}
                  className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                  style={inputStyle}
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !code.trim()}
                  style={{
                    padding: '8px 14px', fontSize: '13px', fontWeight: 600,
                    background: 'var(--color-primary)', color: '#fff',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    opacity: (!code.trim() || isSearching) ? 0.5 : 1,
                  }}
                >
                  <Search size={14} />
                  {t('search')}
                </button>
              </div>

              {searchError && (
                <p style={{ fontSize: '12px', color: 'var(--color-aqi-critical)', marginTop: '8px', margin: '8px 0 0' }}>
                  {searchError}
                </p>
              )}

              {claimMutation.isError && (
                <p style={{ fontSize: '12px', color: 'var(--color-aqi-critical)', marginTop: '8px', margin: '8px 0 0' }}>
                  {t('claimError')}
                </p>
              )}
            </>
          )}

          {/* STEP: confirm */}
          {step === 'confirm' && found && (
            <div style={{ marginTop: '16px' }}>
              <div style={deviceCardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StatusDot status={found.status} />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                    {found.name}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                    {found.code}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {found.model}{found.site_type ? ` · ${found.site_type}` : ''}
                </div>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '12px 0 0' }}>
                {t('claimConfirmText', { workspace: activeWorkspace?.name ?? '' })}
              </p>
            </div>
          )}

          {/* STEP: success */}
          {step === 'success' && found && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
              <CheckCircle size={40} color="var(--color-aqi-good)" />
              <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)', margin: 0 }}>
                {t('claimSuccess')}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center', margin: 0 }}>
                {t('mqttNote')}
              </p>
              <div style={mqttCardStyle}>
                <MqttRow label={t('deviceId')} value={found.device_id} />
                <MqttRow label={t('code')}     value={found.code} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'success' && (
          <div style={footerStyle}>
            <button
              onClick={onClose}
              style={cancelBtnStyle}
            >
              {t('cancel')}
            </button>
            {step === 'confirm' && (
              <button
                onClick={() => claimMutation.mutate()}
                disabled={claimMutation.isPending}
                style={{
                  padding: '7px 16px', fontSize: '13px', fontWeight: 600,
                  background: 'var(--color-primary)', color: '#fff',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  opacity: claimMutation.isPending ? 0.6 : 1,
                }}
              >
                {claimMutation.isPending ? t('claiming') : t('claimConfirm')}
              </button>
            )}
          </div>
        )}

        {step === 'success' && (
          <div style={{ padding: '0 20px 20px' }}>
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '9px', fontSize: '13px', fontWeight: 600,
                background: 'var(--color-primary)', color: '#fff',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
              }}
            >
              {t('done')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function MqttRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-primary)', wordBreak: 'break-all', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}
