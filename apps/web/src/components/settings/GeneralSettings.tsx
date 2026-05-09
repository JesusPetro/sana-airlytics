'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Settings2, Copy, Check, AlertTriangle } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { updateWorkspace, deleteWorkspace } from '@/lib/api/workspaces';
import { useRouter, usePathname } from 'next/navigation';

export function GeneralSettings() {
  const t = useTranslations('settings');
  const { activeWorkspace, refreshWorkspaces, setActiveWorkspace, workspaces } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();

  const [name, setName]        = useState(activeWorkspace?.name ?? '');
  const [description, setDesc] = useState(activeWorkspace?.description ?? '');
  const [saveOk, setSaveOk]    = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  useEffect(() => {
    setName(activeWorkspace?.name ?? '');
    setDesc(activeWorkspace?.description ?? '');
    setSaveOk(false);
    setDeleteInput('');
    setIdCopied(false);
  }, [activeWorkspace?.workspace_id]);

  const copyId = () => {
    navigator.clipboard.writeText(activeWorkspace!.workspace_id);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  const saveMutation = useMutation({
    mutationFn: () => updateWorkspace(activeWorkspace!.workspace_id, {
      name: name.trim() || null,
      description: description.trim() || null,
    }),
    onSuccess: async () => {
      await refreshWorkspaces();
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2500);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteWorkspace(activeWorkspace!.workspace_id),
    onSuccess: async () => {
      await refreshWorkspaces();
      const remaining = workspaces.filter((w) => w.workspace_id !== activeWorkspace?.workspace_id);
      if (remaining.length > 0) setActiveWorkspace(remaining[0]);
      const locale = pathname.split('/')[1];
      router.push(`/${locale}/dashboard`);
    },
  });

  if (!activeWorkspace) return null;

  const canDelete = deleteInput.trim() === activeWorkspace.name;
  const isDirty = name !== activeWorkspace.name ||
                  (description ?? '') !== (activeWorkspace.description ?? '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Form */}
      <section style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <Settings2 size={15} style={{ color: 'var(--color-text-secondary)' }} />
          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
            {t('generalTitle')}
          </span>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label={t('workspaceName')}>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </Field>
          <Field label={`${t('workspaceDesc')} (${t('optional')})`}>
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>
          {/* Workspace ID — read-only, copyable */}
          <Field label={t('workspaceId')}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{
                flex: 1, padding: '8px 10px', fontSize: '12px', fontFamily: 'monospace',
                background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)',
                borderRadius: '8px', color: 'var(--color-text-secondary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {activeWorkspace.workspace_id}
              </span>
              <button
                onClick={copyId}
                title={idCopied ? t('copied') : 'Copy'}
                style={{
                  padding: '8px', border: '1px solid var(--color-border)',
                  borderRadius: '8px', background: 'var(--color-surface-subtle)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  color: idCopied ? 'var(--color-aqi-good)' : 'var(--color-text-secondary)',
                  transition: 'color 0.15s',
                  flexShrink: 0,
                }}
              >
                {idCopied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </Field>
          {saveMutation.isError && (
            <p style={{ fontSize: '12px', color: 'var(--color-aqi-critical)', margin: 0 }}>{t('saveError')}</p>
          )}
        </div>
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--color-border-subtle)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!isDirty || saveMutation.isPending || !name.trim()}
            style={{
              padding: '7px 18px', fontSize: '13px', fontWeight: 600,
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              opacity: (!isDirty || saveMutation.isPending || !name.trim()) ? 0.5 : 1,
            }}
          >
            {saveMutation.isPending ? t('saving') : t('save')}
          </button>
          {saveOk && (
            <span style={{ fontSize: '12px', color: 'var(--color-aqi-good)' }}>{t('saveSuccess')}</span>
          )}
        </div>
      </section>

      {/* Danger zone */}
      <section style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-aqi-critical)',
        borderRadius: '12px', overflow: 'hidden',
        opacity: 0.9,
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <AlertTriangle size={15} style={{ color: 'var(--color-aqi-critical)' }} />
          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-aqi-critical)' }}>
            {t('dangerZone')}
          </span>
        </div>
        <div style={{ padding: '20px' }}>
          {!showDeleteZone ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {t('deleteTitle')}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {t('deleteDesc')}
                </div>
              </div>
              <button
                onClick={() => setShowDeleteZone(true)}
                style={{
                  padding: '7px 14px', fontSize: '12px', fontWeight: 600,
                  background: 'none', color: 'var(--color-aqi-critical)',
                  border: '1px solid var(--color-aqi-critical)',
                  borderRadius: '8px', cursor: 'pointer', flexShrink: 0,
                }}
              >
                {t('deleteBtn')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                {t('deleteConfirmInstruction', { name: activeWorkspace.name })}
              </p>
              <input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={activeWorkspace.name}
                style={{ ...inputStyle, borderColor: 'var(--color-aqi-critical)' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setShowDeleteZone(false); setDeleteInput(''); }}
                  style={{
                    padding: '7px 14px', fontSize: '12px',
                    background: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px', cursor: 'pointer', color: 'var(--color-text-primary)',
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={!canDelete || deleteMutation.isPending}
                  style={{
                    padding: '7px 14px', fontSize: '12px', fontWeight: 600,
                    background: 'var(--color-aqi-critical)', color: '#fff',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    opacity: (!canDelete || deleteMutation.isPending) ? 0.5 : 1,
                  }}
                >
                  {deleteMutation.isPending ? t('deleting') : t('deleteConfirmBtn')}
                </button>
              </div>
              {deleteMutation.isError && (
                <p style={{ fontSize: '12px', color: 'var(--color-aqi-critical)', margin: 0 }}>{t('deleteError')}</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
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
  outline: 'none', width: '100%', boxSizing: 'border-box',
};
