'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/context/WorkspaceContext';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { MembersPanel } from '@/components/settings/MembersPanel';
import { EmptyWorkspace } from '@/components/ui/EmptyWorkspace';
import { isAdminOrOwner } from '@/lib/roles';

type Tab = 'general' | 'members';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { activeWorkspace } = useWorkspace();
  const [tab, setTab] = useState<Tab>('general');

  useEffect(() => {
    const stored = localStorage.getItem('settings-tab') as Tab | null;
    if (stored === 'general' || stored === 'members') setTab(stored);
  }, []);

  function changeTab(newTab: Tab) {
    setTab(newTab);
    localStorage.setItem('settings-tab', newTab);
  }

  if (!activeWorkspace) return <EmptyWorkspace msg={t('noWorkspace')} />;
  if (!isAdminOrOwner(activeWorkspace)) return null;

  return (
    <div style={{ padding: '32px', maxWidth: '760px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        marginBottom: '28px',
      }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
          background: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 700, color: '#fff', userSelect: 'none',
        }}>
          {activeWorkspace.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 2px' }}>
            {activeWorkspace.name}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
            {t('title')}
            {activeWorkspace.description && <> &middot; {activeWorkspace.description}</>}
          </p>
        </div>
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
            onClick={() => changeTab(key)}
            style={{
              padding: '5px 16px', fontSize: '12px', fontWeight: tab === key ? 600 : 400,
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

      {/* Content — full width of container */}
      {tab === 'general' ? <GeneralSettings /> : <MembersPanel />}
    </div>
  );
}
