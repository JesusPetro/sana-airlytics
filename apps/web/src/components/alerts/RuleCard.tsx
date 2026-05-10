'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, WifiOff, Battery, Pencil, Trash2 } from 'lucide-react';
import type { AlertRuleResponse, DatastreamResponse } from '@/types/analytics';

const METRIC_ICON: Record<string, React.ElementType> = {
  THRESHOLD:      Bell,
  SENSOR_OFFLINE: WifiOff,
  BATTERY_LOW:    Battery,
};

const OPERATOR_SYMBOL: Record<string, string> = {
  GT:  '>',
  LT:  '<',
  GTE: '>=',
  LTE: '<=',
};

interface RuleCardProps {
  rule: AlertRuleResponse;
  datastreams?: DatastreamResponse[];
  onToggle: (ruleId: string, isActive: boolean) => void;
  onEdit: (rule: AlertRuleResponse) => void;
  onDelete: (ruleId: string) => void;
  isToggling: boolean;
  isDeleting: boolean;
}

export function RuleCard({ rule, datastreams, onToggle, onEdit, onDelete, isToggling, isDeleting }: RuleCardProps) {
  const t = useTranslations('alerts');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const Icon = METRIC_ICON[rule.metric] ?? Bell;

  const metricEntry = datastreams?.find((ds) => ds.unit_id === rule.unit_id);
  const metricLabel = metricEntry
    ? `${metricEntry.property_name} (${metricEntry.unit_symbol})`
    : rule.name;

  const opSymbol = rule.operator ? (OPERATOR_SYMBOL[rule.operator] ?? rule.operator) : null;
  const description = opSymbol && rule.threshold != null
    ? `${metricLabel} ${opSymbol} ${rule.threshold}`
    : metricLabel;

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1px solid ${rule.is_active ? 'var(--color-border)' : 'var(--color-border-subtle)'}`,
      borderRadius: '10px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      opacity: rule.is_active ? 1 : 0.55,
      transition: 'opacity 0.2s, border-color 0.2s',
    }}>
      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
        background: rule.is_active ? 'var(--color-primary-surface)' : 'var(--color-surface-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: rule.is_active ? 'var(--color-primary)' : 'var(--color-text-disabled)',
      }}>
        <Icon size={16} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {rule.name}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px', fontFamily: 'monospace' }}>
          {description}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {confirmDelete ? (
          <>
            <button
              onClick={() => { onDelete(rule.rule_id); setConfirmDelete(false); }}
              disabled={isDeleting}
              style={{
                fontSize: '11px', fontWeight: 600, padding: '4px 8px',
                borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: 'var(--color-aqi-critical)', color: '#fff',
                opacity: isDeleting ? 0.6 : 1,
              }}
            >
              {t('confirmDelete')}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                fontSize: '11px', padding: '4px 8px', borderRadius: '6px',
                border: '1px solid var(--color-border)', cursor: 'pointer',
                background: 'none', color: 'var(--color-text-secondary)',
              }}
            >
              {t('cancel')}
            </button>
          </>
        ) : (
          <>
            {/* Toggle */}
            <button
              role="switch"
              aria-checked={rule.is_active}
              onClick={() => onToggle(rule.rule_id, !rule.is_active)}
              disabled={isToggling}
              style={{
                width: 32, height: 18, borderRadius: '9999px', border: 'none',
                cursor: isToggling ? 'wait' : 'pointer',
                background: rule.is_active ? 'var(--color-primary)' : 'var(--color-border)',
                position: 'relative', transition: 'background 0.2s',
                opacity: isToggling ? 0.6 : 1, flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: 3,
                left: rule.is_active ? 16 : 3,
                width: 12, height: 12, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
              }} />
            </button>

            {/* Edit */}
            <button
              onClick={() => onEdit(rule)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                color: 'var(--color-text-disabled)', borderRadius: '6px', display: 'flex',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-primary)';
                e.currentTarget.style.background = 'var(--color-surface-subtle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-disabled)';
                e.currentTarget.style.background = 'none';
              }}
            >
              <Pencil size={14} />
            </button>

            {/* Delete */}
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                color: 'var(--color-text-disabled)', borderRadius: '6px', display: 'flex',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-aqi-critical)';
                e.currentTarget.style.background = 'var(--color-surface-subtle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-disabled)';
                e.currentTarget.style.background = 'none';
              }}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
