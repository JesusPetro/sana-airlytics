import type { WorkspaceSummary } from '@/types/workspace';

const LEVEL: Record<string, number> = { viewer: 0, editor: 1, admin: 2 };

function level(ws: WorkspaceSummary | null): number {
  if (!ws) return -1;
  // role === null significa owner (confirmado por el backend)
  if (ws.role === null || ws.membership_type === 'owner') return 3;
  return LEVEL[ws.role] ?? -1;
}

export const isAdminOrOwner = (ws: WorkspaceSummary | null) => level(ws) >= 2;
export const isEditorOrAbove = (ws: WorkspaceSummary | null) => level(ws) >= 1;
export const roleLevel = level;
