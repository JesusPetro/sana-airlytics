'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Building2, ChevronDown, Check, Settings, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWorkspace } from '@/context/WorkspaceContext';
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal';
import { Skel } from '@/components/ui/Skeleton';
import { isAdminOrOwner } from '@/lib/roles';

export function WorkspacePill() {
  const t = useTranslations();
  const { locale } = useParams<{ locale: string }>();
  const { workspaces, activeWorkspace, setActiveWorkspace, isLoading } = useWorkspace();
  const [open, setOpen]           = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (isLoading) {
    return <Skel w={130} h={32} r={9999} />;
  }

  return (
    <>
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer"
          style={{
            background: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-hover)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-subtle)';
          }}
          aria-label={t('workspace.select')}
          aria-expanded={open}
        >
          <Building2 size={14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          <span className="hidden md:inline" style={{ fontSize: '13px' }}>
            {activeWorkspace?.name ?? t('workspace.select')}
          </span>
          <ChevronDown
            size={13}
            style={{
              color: 'var(--color-text-secondary)',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 150ms ease',
            }}
          />
        </button>

        {open && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: '210px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            zIndex: 40,
            padding: '4px',
          }}>
            {/* Workspace list */}
            {workspaces.length === 0 ? (
              <p style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {t('workspace.noWorkspaces')}
              </p>
            ) : (
              workspaces.map((ws) => (
                <button
                  key={ws.workspace_id}
                  onClick={() => { setActiveWorkspace(ws); setOpen(false); }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm transition-colors"
                  style={{ background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-hover)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <Check
                    size={13}
                    style={{ color: 'var(--color-accent)', opacity: activeWorkspace?.workspace_id === ws.workspace_id ? 1 : 0, flexShrink: 0 }}
                  />
                  <span>{ws.name}</span>
                </button>
              ))
            )}

            {/* Divider */}
            <div style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '4px 0' }} />

            {/* Create workspace */}
            <button
              onClick={() => { setOpen(false); setShowCreate(true); }}
              className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm transition-colors"
              style={{ background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              onMouseEnter={(e) => { Object.assign((e.currentTarget as HTMLButtonElement).style, { background: 'var(--color-surface-hover)', color: 'var(--color-text-primary)' }); }}
              onMouseLeave={(e) => { Object.assign((e.currentTarget as HTMLButtonElement).style, { background: 'transparent', color: 'var(--color-text-secondary)' }); }}
            >
              <Plus size={13} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px' }}>{t('workspace.create')}</span>
            </button>

            {/* Settings link — solo admin/owner */}
            {activeWorkspace && isAdminOrOwner(activeWorkspace) && (
              <Link
                href={`/${locale}/settings`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm transition-colors"
                style={{ background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', textDecoration: 'none' }}
                onMouseEnter={(e) => { Object.assign((e.currentTarget as HTMLAnchorElement).style, { background: 'var(--color-surface-hover)', color: 'var(--color-text-primary)' }); }}
                onMouseLeave={(e) => { Object.assign((e.currentTarget as HTMLAnchorElement).style, { background: 'transparent', color: 'var(--color-text-secondary)' }); }}
              >
                <Settings size={13} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px' }}>{t('workspace.settings')}</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {showCreate && <CreateWorkspaceModal onClose={() => setShowCreate(false)} />}
    </>
  );
}
