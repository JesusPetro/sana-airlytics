'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { X, CheckCircle } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useDevices } from '@/hooks/useDevices';
import { createAlertRule } from '@/lib/api/alerts';

const METRICS = [
  { code: 'pm2_5', label: 'PM2.5', unit: 'µg/m³' },
  { code: 'pm10',  label: 'PM10',  unit: 'µg/m³' },
  { code: 'co2',   label: 'CO₂',   unit: 'ppm' },
  { code: 'voc_index',   label: 'VOC Index', unit: '' },
  { code: 'nox_index',   label: 'NOx Index', unit: '' },
  { code: 'pm1',         label: 'PM1',       unit: 'µg/m³' },
  { code: 'pm4',         label: 'PM4',       unit: 'µg/m³' },
  { code: 'temperature', label: 'Temp',      unit: '°C' },
  { code: 'humidity',    label: 'Humidity',  unit: '%' },
];

const OPERATORS = ['>', '>=', '<', '<=', '=='];

interface NewRuleModalProps {
  onClose: () => void;
}

export function NewRuleModal({ onClose }: NewRuleModalProps) {
  const t = useTranslations('alerts');
  const { activeWorkspace } = useWorkspace();
  const qc = useQueryClient();
  const { data: devices = [] } = useDevices(activeWorkspace?.workspace_id);

  const [name,      setName]      = useState('');
  const [metric,    setMetric]    = useState('pm2_5');
  const [operator,  setOperator]  = useState('>');
  const [threshold, setThreshold] = useState('');
  const [unitId,    setUnitId]    = useState('');
  const [done,      setDone]      = useState(false);

  const mutation = useMutation({
    mutationFn: () => createAlertRule(activeWorkspace!.workspace_id, {
      name,
      metric,
      operator,
      threshold: threshold !== '' ? Number(threshold) : undefined,
      unit_id:   unitId || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alert-rules', activeWorkspace?.workspace_id] });
      setDone(true);
    },
  });

  const metricObj   = METRICS.find((m) => m.code === metric);
  const deviceLabel = devices.find((d) => d.device_id === unitId)?.name ?? '';
  const isValid     = name.trim().length > 0;

  const preview = isValid
    ? `${t('previewIf')} ${metricObj?.label ?? metric} ${operator} ${threshold || '?'} ${metricObj?.unit ?? ''}${deviceLabel ? ` (${deviceLabel})` : ''} → ${name}`
    : t('previewFillForm');

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)', zIndex: 300, backdropFilter: 'blur(4px)',
      }} />

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
                  <select value={metric} onChange={(e) => setMetric(e.target.value)} style={inputStyle}>
                    {METRICS.map((m) => (
                      <option key={m.code} value={m.code}>{m.label}{m.unit ? ` (${m.unit})` : ''}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t('fieldOperator')}>
                  <select value={operator} onChange={(e) => setOperator(e.target.value)} style={{ ...inputStyle, width: '70px' }}>
                    {OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
                  </select>
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

              {/* Device scope (optional) */}
              {devices.length > 0 && (
                <Field label={`${t('fieldDevice')} (${t('optional')})`}>
                  <select value={unitId} onChange={(e) => setUnitId(e.target.value)} style={inputStyle}>
                    <option value="">{t('allDevices')}</option>
                    {devices.map((d) => (
                      <option key={d.device_id} value={d.device_id}>{d.name} — {d.code}</option>
                    ))}
                  </select>
                </Field>
              )}

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
