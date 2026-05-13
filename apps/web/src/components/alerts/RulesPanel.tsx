'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAlertRules } from '@/hooks/useAlertRules';
import { getDatastreams } from '@/lib/api/analytics';
import { EditRuleModal } from './EditRuleModal';
import { RuleCard } from './RuleCard';
import { Skel } from '@/components/ui/Skeleton';
import type { AlertRuleResponse } from '@/types/analytics';

interface RulesPanelProps {
  onNewRule?: () => void;
}

export function RulesPanel({ onNewRule }: RulesPanelProps) {
  const t = useTranslations('alerts');
  const { activeWorkspace } = useWorkspace();
  const { data: rules = [], isLoading, toggle, remove, edit } = useAlertRules(activeWorkspace?.workspace_id);
  const [editingRule, setEditingRule] = useState<AlertRuleResponse | null>(null);

  const { data: datastreams = [] } = useQuery({
    queryKey:  ['datastreams', activeWorkspace?.workspace_id],
    queryFn:   () => getDatastreams(activeWorkspace!.workspace_id),
    enabled:   !!activeWorkspace?.workspace_id,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid var(--color-border-subtle)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
            {t('rulesTitle')}
          </span>
          {!isLoading && (
            <span style={countBadgeStyle}>
              {rules.length}
            </span>
          )}
        </div>
        {onNewRule && (
          <button
            onClick={onNewRule}
            style={newRuleBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-dark)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-primary)')}
          >
            + {t('newRule')}
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{
              background: 'var(--color-surface-subtle)',
              borderRadius: '10px', padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <Skel w={36} h={36} r={8} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Skel w="60%" h={12} />
                <Skel w="40%" h={10} />
              </div>
              <Skel w={32} h={18} r={9999} />
            </div>
          ))
        ) : rules.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '24px 0', margin: 0 }}>
            {t('noRules')}
          </p>
        ) : (
          rules.map((rule) => (
            <RuleCard
              key={rule.rule_id}
              rule={rule}
              datastreams={datastreams}
              onToggle={(id, active) => toggle.mutate({ ruleId: id, isActive: active })}
              onEdit={(rule) => setEditingRule(rule)}
              onDelete={(id) => remove.mutate(id)}
              isToggling={toggle.isPending}
              isDeleting={remove.isPending}
            />
          ))
        )}
      </div>

      {editingRule && (
        <EditRuleModal
          rule={editingRule}
          datastreams={datastreams}
          onClose={() => setEditingRule(null)}
          onSave={(ruleId, name, operator, threshold) => {
            edit.mutate(
              { ruleId, name, operator, threshold },
              { onSuccess: () => setEditingRule(null) },
            );
          }}
          isSaving={edit.isPending}
        />
      )}
    </div>
  );
}

const countBadgeStyle: React.CSSProperties = {
  fontSize: '12px', color: 'var(--color-text-secondary)',
  background: 'var(--color-surface-subtle)',
  borderRadius: '9999px', padding: '1px 8px',
};

const newRuleBtnStyle: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600,
  background: 'var(--color-primary)', color: '#fff',
  border: 'none', borderRadius: '8px', padding: '7px 14px',
  cursor: 'pointer', transition: 'background 0.15s',
};
