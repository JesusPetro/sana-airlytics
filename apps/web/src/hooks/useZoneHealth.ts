import { useQuery } from '@tanstack/react-query';
import { getZoneHealth } from '@/lib/api/zones';

export function useZoneHealth(
  zoneId: string | undefined,
  fromDt: string | undefined,
  toDt: string | undefined,
) {
  return useQuery({
    queryKey:  ['zone-health', zoneId, fromDt, toDt],
    queryFn:   () => getZoneHealth(zoneId!, fromDt!, toDt!),
    enabled:   !!zoneId && !!fromDt && !!toDt,
    staleTime: 2 * 60 * 1000,
  });
}
