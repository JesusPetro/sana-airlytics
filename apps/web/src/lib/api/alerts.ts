import { apiClient } from './client';
import type { AlertRuleResponse, AlertEventResponse } from '@/types/analytics';

export function getAlertRules(wsId: string): Promise<AlertRuleResponse[]> {
  return apiClient<AlertRuleResponse[]>(`/api/v1/workspaces/${wsId}/alert-rules`);
}

export function createAlertRule(
  wsId: string,
  body: { name: string; metric: string; operator?: string; threshold?: number; unit_id?: string },
): Promise<AlertRuleResponse> {
  return apiClient<AlertRuleResponse>(`/api/v1/workspaces/${wsId}/alert-rules`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function toggleAlertRule(wsId: string, ruleId: string, isActive: boolean): Promise<void> {
  return apiClient<void>(`/api/v1/workspaces/${wsId}/alert-rules/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
}

export function deleteAlertRule(wsId: string, ruleId: string): Promise<void> {
  return apiClient<void>(`/api/v1/workspaces/${wsId}/alert-rules/${ruleId}`, {
    method: 'DELETE',
  });
}
