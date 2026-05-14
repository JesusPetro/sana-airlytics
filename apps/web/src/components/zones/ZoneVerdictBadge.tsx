'use client';

import type React from 'react';
import { useTranslations } from 'next-intl';

export const VERDICT_COLOR: Record<string, string> = {
  good:      'var(--color-aqi-good)',
  moderate:  'var(--color-aqi-moderate)',
  elevated:  'var(--color-aqi-elevated)',
  unhealthy: 'var(--color-aqi-unhealthy)',
  critical:  'var(--color-aqi-critical)',
  hazardous: 'var(--color-aqi-hazardous)',
  unknown:   '#6B7280',
};

const VERDICT_BG: Record<string, string> = {
  good:      'rgba(16,185,129,0.12)',
  moderate:  'rgba(59,130,246,0.12)',
  elevated:  'rgba(139,92,246,0.12)',
  unhealthy: 'rgba(236,72,153,0.12)',
  critical:  'rgba(239,68,68,0.12)',
  hazardous: 'rgba(153,27,27,0.12)',
  unknown:   'rgba(107,114,128,0.12)',
};

interface ZoneVerdictBadgeProps {
  verdict: string;
  size?: 'sm' | 'md';
}

export function ZoneVerdictBadge({ verdict, size = 'md' }: ZoneVerdictBadgeProps) {
  const t = useTranslations('zones');
  const color = VERDICT_COLOR[verdict] ?? VERDICT_COLOR.unknown;
  const bg    = VERDICT_BG[verdict]    ?? VERDICT_BG.unknown;

  const labelKey: Record<string, string> = {
    good:      t('verdictGood'),
    moderate:  t('verdictModerate'),
    elevated:  t('verdictElevated'),
    unhealthy: t('verdictUnhealthy'),
    critical:  t('verdictCritical'),
    hazardous: t('verdictHazardous'),
    unknown:   t('verdictNoData'),
  };

  const style: React.CSSProperties = {
    display:      'inline-flex',
    alignItems:   'center',
    gap:          '5px',
    padding:      size === 'sm' ? '2px 7px' : '3px 9px',
    borderRadius: '9999px',
    background:   bg,
    border:       `1px solid ${color}33`,
    fontSize:     size === 'sm' ? '11px' : '12px',
    fontWeight:   600,
    color,
    whiteSpace:   'nowrap',
  };

  return (
    <span style={style}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {labelKey[verdict] ?? verdict}
    </span>
  );
}
