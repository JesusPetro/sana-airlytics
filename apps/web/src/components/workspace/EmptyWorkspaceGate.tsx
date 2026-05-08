'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Building2 } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';

export function EmptyWorkspaceGate({ children }: { children: ReactNode }) {
  const { workspaces, isLoading } = useWorkspace();
  const [showModal, setShowModal] = useState(false);
  const t = useTranslations('workspace');

  if (isLoading || workspaces.length > 0) return <>{children}</>;

  return (
    <>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: 'calc(100vh - var(--topbar-h))',
        gap: '16px',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '14px',
          background: 'var(--color-primary-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-primary)',
        }}>
          <Building2 size={26} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-text-primary)', margin: '0 0 6px' }}>
            {t('noWorkspaceTitle')}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
            {t('noWorkspaceSubtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            marginTop: '4px', padding: '9px 24px', fontSize: '13px', fontWeight: 600,
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: '9px', cursor: 'pointer',
          }}
        >
          + {t('noWorkspaceCta')}
        </button>
      </div>

      {showModal && <CreateWorkspaceModal onClose={() => setShowModal(false)} />}
    </>
  );
}
