import { apiClient } from './client';
import type { WorkspaceSummary, CollaboratorSummary } from '@/types/workspace';

export function getWorkspaces(): Promise<WorkspaceSummary[]> {
  return apiClient<WorkspaceSummary[]>('/api/v1/workspaces');
}

export function createWorkspace(body: {
  name: string;
  description?: string | null;
  is_private?: boolean;
}): Promise<{ workspace_id: string }> {
  return apiClient<{ workspace_id: string }>('/api/v1/workspaces', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateWorkspace(wsId: string, body: {
  name?: string | null;
  description?: string | null;
  is_private?: boolean | null;
}): Promise<void> {
  return apiClient<void>(`/api/v1/workspaces/${wsId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteWorkspace(wsId: string): Promise<void> {
  return apiClient<void>(`/api/v1/workspaces/${wsId}`, { method: 'DELETE' });
}

export function getCollaborators(wsId: string): Promise<CollaboratorSummary[]> {
  return apiClient<CollaboratorSummary[]>(`/api/v1/workspaces/${wsId}/collaborators`);
}

export function inviteCollaborator(wsId: string, body: { email: string; role: string }): Promise<void> {
  return apiClient<void>(`/api/v1/workspaces/${wsId}/collaborators`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function changeCollaboratorRole(wsId: string, userId: string, role: string): Promise<void> {
  return apiClient<void>(`/api/v1/workspaces/${wsId}/collaborators/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export function removeCollaborator(wsId: string, userId: string): Promise<void> {
  return apiClient<void>(`/api/v1/workspaces/${wsId}/collaborators/${userId}`, {
    method: 'DELETE',
  });
}
