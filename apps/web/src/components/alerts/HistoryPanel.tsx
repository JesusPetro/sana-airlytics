'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAlertHistory } from '@/hooks/useAlertHistory';
import { Badge } from '@/components/ui/Badge';
import { Skel } from '@/components/ui/Skeleton';
import { formatRelative } from '@/lib/format';

type Severity = 'all' | 'critical' | 'warning' | 'info';

function getSeverity(_message: string): 'critical' | 'warning' | 'info' {
  return 'warning';
}

const PAGE_SIZE = 10;

export function HistoryPanel() {
  const t      = useTranslations('alerts');
  const locale = useLocale();
  const { activeWorkspace } = useWorkspace();
  const { data: events = [], isLoading } = useAlertHistory(activeWorkspace?.workspace_id);

  const [filter, setFilter]   = useState<Severity>('all');
  const [page, setPage]       = useState(0);

  const filtered = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter((e) => getSeverity(e.message) === filter);
  }, [events, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageEvents = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleFilter(f: Severity) {
    setFilter(f);
    setPage(0);
  }

  const FILTERS: { key: Severity; label: string }[] = [
    { key: 'all',      label: t('filterAll') },
    { key: 'critical', label: t('filterCritical') },
    { key: 'warning',  label: t('filterWarning') },
    { key: 'info',     label: t('filterInfo') },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
            {t('historyTitle')}
          </span>
          {!isLoading && (
            <span style={styles.countBadge}>
              {filtered.length}
            </span>
          )}
        </div>

        {/* Filter pills */}
        <div style={styles.filterBar}>
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleFilter(key)}
              style={{
                padding: '4px 10px', fontSize: '12px', fontWeight: filter === key ? 600 : 400,
                borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: filter === key ? 'var(--color-surface)' : 'transparent',
                color: filter === key ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                boxShadow: filter === key ? 'var(--shadow-sm)' : 'none',
                transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-subtle)' }}>
              {[t('colSeverity'), t('colMessage'), t('colValue'), t('colTime')].map((h, i) => (
                <th key={i} style={styles.tableHeader}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td style={tdStyle}><Skel w={52} h={20} r={9} /></td>
                  <td style={tdStyle}><Skel w="80%" h={12} /></td>
                  <td style={tdStyle}><Skel w={48} h={12} /></td>
                  <td style={tdStyle}><Skel w={64} h={12} /></td>
                </tr>
              ))
            ) : pageEvents.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                  {t('noEvents')}
                </td>
              </tr>
            ) : (
              pageEvents.map((ev) => {
                const severity = getSeverity(ev.message);
                return (
                  <tr
                    key={ev.event_id}
                    style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={tdStyle}>
                      <Badge severity={severity} label={t(`severity${severity.charAt(0).toUpperCase() + severity.slice(1)}` as any)} />
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>
                        {ev.message}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {ev.value != null ? ev.value.toFixed(1) : '—'}
                    </td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatRelative(ev.triggered_at, locale)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && filtered.length > PAGE_SIZE && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px', borderTop: '1px solid var(--color-border-subtle)',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={paginBtn(page === 0)}
          >
            ← {t('prev')}
          </button>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={paginBtn(page >= totalPages - 1)}
          >
            {t('next')} →
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,
  header: {
    padding: '14px 20px',
    borderBottom: '1px solid var(--color-border-subtle)',
    display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0,
  } as React.CSSProperties,
  countBadge: {
    fontSize: '12px', color: 'var(--color-text-secondary)',
    background: 'var(--color-surface-subtle)',
    borderRadius: '9999px', padding: '1px 8px',
  } as React.CSSProperties,
  filterBar: {
    display: 'flex', gap: '4px',
    background: 'var(--color-surface-subtle)',
    borderRadius: '8px', padding: '3px',
    width: 'fit-content',
  } as React.CSSProperties,
  tableHeader: {
    padding: '9px 16px', textAlign: 'left',
    fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
  } as React.CSSProperties,
};

const tdStyle: React.CSSProperties = {
  padding: '11px 16px',
  verticalAlign: 'middle',
};

function paginBtn(disabled: boolean): React.CSSProperties {
  return {
    fontSize: '12px', fontWeight: 500, padding: '5px 12px',
    borderRadius: '7px', border: '1px solid var(--color-border)',
    background: 'none', cursor: disabled ? 'default' : 'pointer',
    color: disabled ? 'var(--color-text-disabled)' : 'var(--color-text-primary)',
    opacity: disabled ? 0.4 : 1,
  };
}
