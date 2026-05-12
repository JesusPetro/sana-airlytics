'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { X, CheckCircle } from 'lucide-react';
import { createWorkspace } from '@/lib/api/workspaces';
import { useWorkspace } from '@/context/WorkspaceContext';

interface CreateWorkspaceModalProps {
  onClose: () => void;
}

export function CreateWorkspaceModal({ onClose }: CreateWorkspaceModalProps) {
  const t = useTranslations('workspace');
  const { refreshWorkspaces, setActiveWorkspace } = useWorkspace();

  const [name, setName]        = useState('');
  const [description, setDesc] = useState('');
  const [done, setDone]        = useState(false);

  // WorkspaceContext manages workspace state via refreshWorkspaces() — no React Query cache to invalidate
  const mutation = useMutation({
    mutationFn: () => createWorkspace({
      name: name.trim(),
      description: description.trim() || null,
    }),
    onSuccess: async (res) => {
      const freshList = await refreshWorkspaces();
      setActiveWorkspace(
        freshList?.find((w) => w.workspace_id === res.workspace_id) ??
        { workspace_id: res.workspace_id, name: name.trim(), description: description.trim() || null, is_private: false, owner_user_id: null, owner_org_id: null, role: null, membership_type: 'direct' }
      );
      setDone(true);
    },
  });

  const isValid = name.trim().length > 0;

  return createPortal(
    <>
      <div
        onClick={onClose}
        role="presentation"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, backdropFilter: 'blur(4px)' }}
      />

      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 301, background: 'var(--color-surface)',
        border: '1px solid var(--color-border)', borderRadius: '14px',
        boxShadow: 'var(--shadow-lg)', width: '440px',
        maxWidth: 'calc(100vw - 32px)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: done ? 'flex-end' : 'space-between',
          padding: '18px 20px 14px', borderBottom: done ? 'none' : '1px solid var(--color-border-subtle)',
        }}>
          {!done && (
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>
              {t('create')}
            </span>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px', borderRadius: '6px', display: 'flex' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '8px 20px 32px' }}>
            <CheckCircle size={44} color="var(--color-aqi-good)" />
            <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)', margin: 0 }}>
              {t('created')}
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
              {/* Name */}
              <Field label={t('createName')}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('createNamePlaceholder')}
                  style={inputStyle}
                  autoFocus
                />
              </Field>

              {/* Description */}
              <Field label={`${t('createDescField')} (${t('optional')})`}>
                <input
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder={t('createDescPlaceholder')}
                  style={inputStyle}
                />
              </Field>

              {mutation.isError && (
                <p style={{ fontSize: '12px', color: 'var(--color-aqi-critical)', margin: 0 }}>
                  {t('createError')}
                </p>
              )}
            </div>

            {/* Footer */}
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
                {mutation.isPending ? t('creating') : t('create')}
              </button>
            </div>
          </>
        )}
      </div>
    </>,
    document.body
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px', fontSize: '13px',
  background: 'var(--color-surface-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px', color: 'var(--color-text-primary)',
  outline: 'none', width: '100%',
};
