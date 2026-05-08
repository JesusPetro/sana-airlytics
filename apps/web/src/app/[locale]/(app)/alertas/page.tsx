'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/context/WorkspaceContext';
import { RulesPanel } from '@/components/alerts/RulesPanel';
import { HistoryPanel } from '@/components/alerts/HistoryPanel';
import { NewRuleModal } from '@/components/alerts/NewRuleModal';
import { EmptyWorkspace } from '@/components/ui/EmptyWorkspace';

export default function AlertasPage() {
  const t = useTranslations('alerts');
  const tCommon = useTranslations();
  const { activeWorkspace, isLoading: wsLoading } = useWorkspace();
  const [showModal, setShowModal] = useState(false);

  if (wsLoading) return <EmptyWorkspace msg={tCommon('common.loading')} />;
  if (!activeWorkspace) {
    return <EmptyWorkspace msg={t('noWorkspace')} />;
  }

  return (
    <>
      <div style={{
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: '2fr 3fr',
        gap: '20px',
        alignItems: 'start',
        minHeight: 'calc(100vh - var(--topbar-h))',
      }}>
        <RulesPanel onNewRule={() => setShowModal(true)} />
        <HistoryPanel />
      </div>

      {showModal && <NewRuleModal onClose={() => setShowModal(false)} />}
    </>
  );
}
