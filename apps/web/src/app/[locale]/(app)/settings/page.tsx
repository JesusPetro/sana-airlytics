'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/context/WorkspaceContext';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { MembersPanel } from '@/components/settings/MembersPanel';
import { EmptyWorkspace } from '@/components/ui/EmptyWorkspace';

type Tab = 'general' | 'members';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { activeWorkspace } = useWorkspace();
  const [tab, setTab] = useState<Tab>('general');

  if (!activeWorkspace) return <EmptyWorkspace msg={t('noWorkspace')} />;

  return (
    <div style={{ padding: '28px 24px', maxWidth: '720px' }}>
      {/* Page title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 4px' }}>
          {t('title')}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
          {activeWorkspace.name}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px',
        background: 'var(--color-surface-subtle)',
        borderRadius: '8px', padding: '3px',
        width: 'fit-content', marginBottom: '24px',
      }}>
        {(['general', 'members'] as Tab[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '5px 14px', fontSize: '12px', fontWeight: tab === key ? 600 : 400,
              borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: tab === key ? 'var(--color-surface)' : 'transparent',
              color: tab === key ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              boxShadow: tab === key ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {t(key === 'general' ? 'tabGeneral' : 'tabMembers')}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'general' ? <GeneralSettings /> : <MembersPanel />}
    </div>
  );
}
