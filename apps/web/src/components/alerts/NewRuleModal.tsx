'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { X, CheckCircle } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { createAlertRule } from '@/lib/api/alerts';
import { getDatastreams } from '@/lib/api/analytics';
import { Select } from '@/components/ui/Select';

const OPERATOR_OPTIONS = [
  { symbol: '>',  code: 'GT'  },
  { symbol: '>=', code: 'GTE' },
  { symbol: '<',  code: 'LT'  },
  { symbol: '<=', code: 'LTE' },
];

interface NewRuleModalProps {
  onClose: () => void;
}

export function NewRuleModal({ onClose }: NewRuleModalProps) {
  const t = useTranslations('alerts');
  const { activeWorkspace } = useWorkspace();
  const qc = useQueryClient();

  const [name,           setName]           = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('>');
  const [threshold,      setThreshold]      = useState('');
  const [done,           setDone]           = useState(false);

  const { data: datastreams = [] } = useQuery({
    queryKey: ['datastreams', activeWorkspace?.workspace_id],
    queryFn: () => getDatastreams(activeWorkspace!.workspace_id),
    enabled: !!activeWorkspace?.workspace_id,
  });

  const metricOptions = useMemo(() => {
    const seen = new Set<string>();
    return datastreams
      .filter((ds) => {
        if (seen.has(ds.unit_id)) return false;
        seen.add(ds.unit_id);
        return true;
      })
      .map((ds) => ({
        unit_id:       ds.unit_id,
        label:         `${ds.property_name} (${ds.unit_symbol})`,
        unit_symbol:   ds.unit_symbol,
        property_name: ds.property_name,
      }));
  }, [datastreams]);

  const selectedOption = metricOptions.find((o) => o.unit_id === selectedUnitId);

  const thresholdNum = Number(threshold);
  const isValid =
    name.trim().length > 0 &&
    selectedUnitId !== '' &&
    threshold !== '' &&
    !Number.isNaN(thresholdNum) &&
    thresholdNum > 0;

  const preview = selectedOption && threshold
    ? `${t('previewIf')} ${selectedOption.property_name} ${selectedSymbol} ${threshold} ${selectedOption.unit_symbol} → ${name}`
    : t('previewFillForm');

  const mutation = useMutation({
    mutationFn: () => createAlertRule(activeWorkspace!.workspace_id, {
      name,
      metric: 'THRESHOLD',
      operator: OPERATOR_OPTIONS.find((o) => o.symbol === selectedSymbol)!.code,
      threshold: thresholdNum,
      unit_id: selectedUnitId,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alert-rules', activeWorkspace?.workspace_id] });
      setDone(true);
    },
  });

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
            {t('newRule')}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', padding: '4px', borderRadius: '6px' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '32px 20px' }}>
            <CheckCircle size={40} color="var(--color-aqi-good)" />
            <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)', margin: 0 }}>
              {t('ruleCreated')}
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

              {/* Metric + Operator + Threshold */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', alignItems: 'end' }}>
                <Field label={t('fieldMetric')}>
                  <Select
                    value={selectedUnitId}
                    onChange={setSelectedUnitId}
                    options={[
                      { value: '', label: t('selectMetric') },
                      ...metricOptions.map((o) => ({ value: o.unit_id, label: o.label })),
                    ]}
                  />
                </Field>
                <Field label={t('fieldOperator')}>
                  <Select
                    value={selectedSymbol}
                    onChange={setSelectedSymbol}
                    options={OPERATOR_OPTIONS.map((o) => ({ value: o.symbol, label: o.symbol }))}
                    style={{ width: '70px' }}
                  />
                </Field>
                <Field label={t('fieldThreshold')}>
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="—"
                    style={{ ...inputStyle, width: '80px' }}
                  />
                </Field>
              </div>

              {/* Preview */}
              <div style={{
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px', padding: '10px 14px',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  {t('preview')}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-primary)', margin: 0, fontFamily: 'monospace' }}>
                  {preview}
                </p>
              </div>

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
                {mutation.isPending ? t('creating') : t('createRule')}
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
