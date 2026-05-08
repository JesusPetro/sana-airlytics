'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { UserCircle2 } from 'lucide-react';
import { getCollaborators, changeCollaboratorRole, removeCollaborator } from '@/lib/api/workspaces';
import { useWorkspace } from '@/context/WorkspaceContext';
import { InviteMemberModal } from './InviteMemberModal';
import { Skel } from '@/components/ui/Skeleton';

const ROLES = ['viewer', 'editor', 'admin'] as const;

export function MembersPanel() {
  const t = useTranslations('members');
  const { activeWorkspace } = useWorkspace();
  const qc = useQueryClient();
  const wsId = activeWorkspace?.workspace_id;

  const [showInvite, setShowInvite]           = useState(false);
  const [confirmRevoke, setConfirmRevoke]     = useState<string | null>(null);

  const { data: collaborators = [], isLoading } = useQuery({
    queryKey: ['collaborators', wsId],
    queryFn:  () => getCollaborators(wsId!),
    enabled:  !!wsId,
    staleTime: 2 * 60 * 1000,
  });

  const roleChange = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      changeCollaboratorRole(wsId!, userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['collaborators', wsId] }),
  });

  const revoke = useMutation({
    mutationFn: (userId: string) => removeCollaborator(wsId!, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collaborators', wsId] });
      setConfirmRevoke(null);
    },
  });

  if (!activeWorkspace) return null;

  return (
    <>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px', overflow: 'hidden',
        maxWidth: '640px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--color-border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
              {t('title')}
            </span>
            {!isLoading && (
              <span style={{
                fontSize: '11px', color: 'var(--color-text-secondary)',
                background: 'var(--color-surface-subtle)',
                borderRadius: '9999px', padding: '1px 8px',
              }}>
                {collaborators.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowInvite(true)}
            style={{
              fontSize: '12px', fontWeight: 600,
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', borderRadius: '8px', padding: '6px 14px',
              cursor: 'pointer',
            }}
          >
            + {t('invite')}
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)' }}>
                {[t('colUser'), t('colRole'), t('colActions')].map((h, i) => (
                  <th key={i} style={{
                    padding: '9px 16px', textAlign: i === 2 ? 'right' : 'left',
                    fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Skel w={28} h={28} r={9999} /><Skel w={140} h={11} /></div></td>
                    <td style={tdStyle}><Skel w={70} h={24} r={6} /></td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}><Skel w={64} h={24} r={6} /></td>
                  </tr>
                ))
              ) : collaborators.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                    {t('noMembers')}
                  </td>
                </tr>
              ) : (
                collaborators.map((c) => (
                  <tr
                    key={c.collaborator_id}
                    style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* User */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserCircle2 size={22} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                          {c.user_id.slice(0, 12)}…
                        </span>
                      </div>
                    </td>

                    {/* Role selector */}
                    <td style={tdStyle}>
                      {confirmRevoke === c.collaborator_id ? (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>—</span>
                      ) : (
                        <select
                          value={c.role}
                          onChange={(e) => roleChange.mutate({ userId: c.user_id, role: e.target.value })}
                          disabled={roleChange.isPending}
                          style={{
                            fontSize: '11px', fontWeight: 600, padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface-subtle)',
                            color: 'var(--color-text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {t(`role${r.charAt(0).toUpperCase() + r.slice(1)}` as any)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {confirmRevoke === c.collaborator_id ? (
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => revoke.mutate(c.user_id)}
                            disabled={revoke.isPending}
                            style={{
                              fontSize: '11px', fontWeight: 600, padding: '4px 8px',
                              borderRadius: '6px', border: 'none', cursor: 'pointer',
                              background: 'var(--color-aqi-critical)', color: '#fff',
                              opacity: revoke.isPending ? 0.6 : 1,
                            }}
                          >
                            {t('confirmRevoke')}
                          </button>
                          <button
                            onClick={() => setConfirmRevoke(null)}
                            style={{
                              fontSize: '11px', padding: '4px 8px', borderRadius: '6px',
                              border: '1px solid var(--color-border)', cursor: 'pointer',
                              background: 'none', color: 'var(--color-text-secondary)',
                            }}
                          >
                            {t('cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRevoke(c.collaborator_id)}
                          style={{
                            fontSize: '11px', fontWeight: 500, padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            background: 'none', color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--color-aqi-critical)';
                            e.currentTarget.style.borderColor = 'var(--color-aqi-critical)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                          }}
                        >
                          {t('revoke')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showInvite && (
        <InviteMemberModal
          workspaceId={wsId!}
          onClose={() => setShowInvite(false)}
        />
      )}
    </>
  );
}

const tdStyle: React.CSSProperties = {
  padding: '10px 16px',
  verticalAlign: 'middle',
};
