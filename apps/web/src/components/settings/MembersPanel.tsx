'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { getCollaborators, changeCollaboratorRole, removeCollaborator } from '@/lib/api/workspaces';
import { useWorkspace } from '@/context/WorkspaceContext';
import { InviteMemberModal } from './InviteMemberModal';
import { Skel } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';

const ROLES = ['viewer', 'editor', 'admin'] as const;

export function MembersPanel() {
  const t = useTranslations('members');
  const { activeWorkspace } = useWorkspace();
  const qc = useQueryClient();
  const wsId = activeWorkspace?.workspace_id;

  const [showInvite, setShowInvite]       = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

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

  const canInvite = activeWorkspace.role === null || activeWorkspace.role === 'admin';

  return (
    <>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--color-border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={15} style={{ color: 'var(--color-text-secondary)' }} />
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
              {t('title')}
            </span>
            {!isLoading && (
              <span style={countBadgeStyle}>
                {collaborators.length}
              </span>
            )}
          </div>
          {canInvite && (
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
          )}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)' }}>
                {[t('colUser'), t('colRole'), t('colActions')].map((h, i) => (
                  <th key={i} style={{
                    padding: '9px 16px', textAlign: i === 2 ? 'right' : 'left',
                    fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)',
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
                  <td colSpan={3} style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Users size={28} style={{ color: 'var(--color-border)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {t('noMembers')}
                      </span>
                    </div>
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
                        <div style={avatarStyle}>
                          {c.first_name.charAt(0).toUpperCase()}{c.last_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {c.first_name} {c.last_name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {c.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role selector */}
                    <td style={tdStyle}>
                      {confirmRevoke === c.collaborator_id ? (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{'—'}</span>
                      ) : (
                        <Select
                          variant="chip"
                          value={c.role}
                          onChange={(role) => roleChange.mutate({ userId: c.user_id, role })}
                          disabled={roleChange.isPending}
                          options={ROLES.map(r => ({
                            value: r,
                            label: t(`role${r.charAt(0).toUpperCase() + r.slice(1)}` as any),
                          }))}
                        />
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
                              fontSize: '12px', fontWeight: 600, padding: '4px 8px',
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
                              fontSize: '12px', padding: '4px 8px', borderRadius: '6px',
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
                            fontSize: '12px', fontWeight: 500, padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            background: 'none', color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => Object.assign(e.currentTarget.style, { color: 'var(--color-aqi-critical)', borderColor: 'var(--color-aqi-critical)' })}
                          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' })}
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

const countBadgeStyle: React.CSSProperties = {
  fontSize: '12px', color: 'var(--color-text-secondary)',
  background: 'var(--color-surface-subtle)',
  borderRadius: '9999px', padding: '1px 8px',
};

const avatarStyle: React.CSSProperties = {
  width: '26px', height: '26px', borderRadius: '9999px', flexShrink: 0,
  background: 'var(--color-primary)', border: '1px solid var(--color-border)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '12px', fontWeight: 700, color: '#fff',
  userSelect: 'none',
};
