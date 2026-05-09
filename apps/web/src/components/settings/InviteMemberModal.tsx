'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { X, CheckCircle } from 'lucide-react';
import { inviteCollaborator } from '@/lib/api/workspaces';
import { Select } from '@/components/ui/Select';

const ROLES = ['viewer', 'editor', 'admin'] as const;

interface InviteMemberModalProps {
  workspaceId: string;
  onClose: () => void;
}

export function InviteMemberModal({ workspaceId, onClose }: InviteMemberModalProps) {
  const t  = useTranslations('members');
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole]   = useState<string>('viewer');
  const [done, setDone]   = useState(false);

  const mutation = useMutation({
    mutationFn: () => inviteCollaborator(workspaceId, { email: email.trim(), role }),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['collaborators', workspaceId] });
      setDone(true);
      setTimeout(onClose, 1500);
    },
  });

  const isValid = email.trim().includes('@');

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)', zIndex: 300, backdropFilter: 'blur(4px)',
      }} />

      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 301, background: 'var(--color-surface)',
        border: '1px solid var(--color-border)', borderRadius: '14px',
        boxShadow: 'var(--shadow-lg)', width: '400px',
        maxWidth: 'calc(100vw - 32px)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px', borderBottom: '1px solid var(--color-border-subtle)',
        }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>
            {t('inviteTitle')}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px', borderRadius: '6px', display: 'flex' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '32px 20px' }}>
            <CheckCircle size={40} color="var(--color-aqi-good)" />
            <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)', margin: 0 }}>
              {t('inviteSuccess')}
            </p>
            <button onClick={onClose} style={{
              marginTop: '8px', padding: '9px 32px', fontSize: '13px', fontWeight: 600,
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
            }}>
              {t('done')}
            </button>
          </div>
        ) : (
          <>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={labelStyle}>{t('fieldEmail')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  style={inputStyle}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={labelStyle}>{t('fieldRole')}</label>
                <Select
                  value={role}
                  onChange={setRole}
                  options={ROLES.map(r => ({
                    value: r,
                    label: t(`role${r.charAt(0).toUpperCase() + r.slice(1)}` as any),
                  }))}
                />
              </div>
              {mutation.isError && (
                <p style={{ fontSize: '12px', color: 'var(--color-aqi-critical)', margin: 0 }}>
                  {t('inviteError')}
                </p>
              )}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: '8px',
              padding: '14px 20px', borderTop: '1px solid var(--color-border-subtle)',
            }}>
              <button onClick={onClose} style={{
                padding: '7px 16px', fontSize: '13px',
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px', cursor: 'pointer', color: 'var(--color-text-primary)',
              }}>
                {t('cancel')}
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={!isValid || mutation.isPending}
                style={{
                  padding: '7px 16px', fontSize: '13px', fontWeight: 600,
                  background: 'var(--color-primary)', color: '#fff',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  opacity: (!isValid || mutation.isPending) ? 0.5 : 1,
                }}
              >
                {mutation.isPending ? t('inviting') : t('inviteBtn')}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 10px', fontSize: '13px',
  background: 'var(--color-surface-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px', color: 'var(--color-text-primary)',
  outline: 'none', width: '100%',
};
