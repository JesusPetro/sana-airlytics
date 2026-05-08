'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export type TimeRange = '1H' | '6H' | '24H' | '7D';

const VALID_RANGES: TimeRange[] = ['1H', '6H', '24H', '7D'];
const DEFAULT_RANGE: TimeRange = '24H';

function isValidRange(value: string | null): value is TimeRange {
  return VALID_RANGES.includes(value as TimeRange);
}

export function useTimeRange() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = searchParams.get('range');
  const range: TimeRange = isValidRange(raw) ? raw : DEFAULT_RANGE;

  const setRange = useCallback(
    (next: TimeRange) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('range', next);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return { range, setRange };
}

export function rangeToISO(range: TimeRange): { from: string; to: string } {
  const to   = new Date();
  const from = new Date(to);
  switch (range) {
    case '1H':  from.setHours(to.getHours() - 1);   break;
    case '6H':  from.setHours(to.getHours() - 6);   break;
    case '7D':  from.setDate(to.getDate() - 7);      break;
    default:    from.setDate(to.getDate() - 1);      break; // 24H
  }
  return { from: from.toISOString(), to: to.toISOString() };
}
