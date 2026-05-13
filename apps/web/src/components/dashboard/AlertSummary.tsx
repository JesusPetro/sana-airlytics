'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAlertHistory } from '@/hooks/useAlertHistory';
import { formatRelative } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Skel } from '@/components/ui/Skeleton';

function getSeverity(_message: string): 'critical' | 'warning' | 'info' {
  return 'warning';
}

export function AlertSummary() {
  const t      = useTranslations();
  const locale = useLocale();
  const { activeWorkspace } = useWorkspace();
  const { data: events = [], isLoading } = useAlertHistory(activeWorkspace?.workspace_id);

  const recent = events.slice(0, 3);

  return (
    <div
      style={{
        background:    'var(--color-surface)',
        border:        '1px solid var(--color-border)',
        borderRadius:  '12px',
        padding:       '20px',
        display:       'flex',
        flexDirection: 'column',
        gap:           '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {t('alertSummary.title')}
        </span>
        <Link
          href="/alertas"
          style={{ fontSize: '12px', color: 'var(--color-accent)', textDecoration: 'none' }}
        >
          {t('alertSummary.viewAll')}
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px', borderRadius: '8px',
              background: 'var(--color-surface-subtle)',
            }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Skel w="80%" h={12} />
                <Skel w={60} h={10} />
              </div>
              <Skel w={52} h={20} r={9} />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {t('alertSummary.noAlerts')}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recent.map((ev) => {
            const severity = getSeverity(ev.message);
            return (
              <li
                key={ev.event_id}
                style={{
                  display:       'flex',
                  alignItems:    'flex-start',
                  gap:           '10px',
                  padding:       '10px',
                  borderRadius:  '8px',
                  background:    'var(--color-surface-subtle)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize:     '13px',
                    color:        'var(--color-text-primary)',
                    margin:       0,
                    whiteSpace:   'nowrap',
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {ev.message}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                    {formatRelative(ev.triggered_at, locale)}
                  </p>
                </div>
                <Badge severity={severity} label={severity} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
