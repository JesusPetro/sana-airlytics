import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlertRules, toggleAlertRule, deleteAlertRule } from '@/lib/api/alerts';

export function useAlertRules(workspaceId: string | undefined) {
  const qc = useQueryClient();
  const key = ['alert-rules', workspaceId];

  const query = useQuery({
    queryKey:  key,
    queryFn:   () => getAlertRules(workspaceId!),
    enabled:   !!workspaceId,
    staleTime: 5 * 60 * 1000,
    gcTime:    15 * 60 * 1000,
  });

  const toggle = useMutation({
    mutationFn: ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) =>
      toggleAlertRule(workspaceId!, ruleId, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: (ruleId: string) => deleteAlertRule(workspaceId!, ruleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { ...query, toggle, remove };
}
