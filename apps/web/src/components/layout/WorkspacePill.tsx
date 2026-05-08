'use client';

import { Building2, ChevronDown } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';

export function WorkspacePill() {
  const { workspaceName } = useWorkspace();

  return (
    <button
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
      aria-label="Select workspace"
    >
      <Building2 size={14} style={{ color: 'var(--color-text-secondary)' }} />
      <span style={{ fontSize: '13px' }}>{workspaceName}</span>
      <ChevronDown size={13} style={{ color: 'var(--color-text-secondary)' }} />
    </button>
  );
}
