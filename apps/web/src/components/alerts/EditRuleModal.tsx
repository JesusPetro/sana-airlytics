'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, X } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import type { AlertRuleResponse, DatastreamResponse } from '@/types/analytics';

const OPERATOR_OPTIONS = [
  { symbol: '>',  code: 'GT'  },
  { symbol: '>=', code: 'GTE' },
  { symbol: '<',  code: 'LT'  },
  { symbol: '<=', code: 'LTE' },
];

interface EditRuleModalProps {
  rule: AlertRuleResponse;
  datastreams: DatastreamResponse[];
  onClose: () => void;
  onSave: (ruleId: string, name: string, operator: string, threshold: number) => void;
  isSaving: boolean;
}

export function EditRuleModal({ rule, datastreams: _datastreams, onClose, onSave, isSaving }: EditRuleModalProps) {
  const t = useTranslations('alerts');
  const [name, setName] = useState(rule.name);
  const [operator, setOperator] = useState(rule.operator ?? '');
  const [threshold, setThreshold] = useState(rule.threshold != null ? String(rule.threshold) : '');
  const [done, setDone] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && !isSaving) {
      setDone(true);
    }
  }, [isSaving]);

  const isValid =
    name.trim().length > 0 &&
    operator !== '' &&
    threshold !== '' &&
    !Number.isNaN(Number(threshold)) &&
    Number(threshold) > 0;

  function handleSave() {
    submitted.current = true;
    onSave(rule.rule_id, name, operator, Number(threshold));
  }

  return (
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
        boxShadow: 'var(--shadow-lg)', width: '480px',
        maxWidth: 'calc(100vw - 32px)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px', borderBottom: '1px solid var(--color-border-subtle)',
        }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>
            {t('editRuleTitle')}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', padding: '4px', borderRadius: '6px' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '32px 20px' }}>
            <CheckCircle size={40} color="var(--color-aqi-good)" />
            <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)', margin: 0 }}>
              {t('editSuccess')}
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
              <Field label={t('fieldName')}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('fieldNamePlaceholder')}
                  style={inputStyle}
                />
              </Field>

              {/* Operator + Threshold */}
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px', alignItems: 'end' }}>
                <Field label={t('fieldOperator')}>
                  <Select
                    value={operator}
                    onChange={setOperator}
                    options={OPERATOR_OPTIONS.map((o) => ({ value: o.code, label: o.symbol }))}
                    style={{ width: '90px' }}
                  />
                </Field>
                <Field label={t('fieldThreshold')}>
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="—"
                    style={inputStyle}
                  />
                </Field>
              </div>
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
                onClick={handleSave}
                disabled={!isValid || isSaving}
                style={{
                  padding: '7px 16px', fontSize: '13px', fontWeight: 600,
                  background: 'var(--color-primary)', color: '#fff',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  opacity: (!isValid || isSaving) ? 0.5 : 1,
                }}
              >
                {isSaving ? t('saving') : t('saveChanges')}
              </button>
            </div>
          </>
        )}
      </div>
    </>
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
