import { colorFromLevel } from '@/lib/aqi';

interface BadgeProps {
  level?: string;
  severity?: 'info' | 'warning' | 'critical';
  label: string;
}

const SEVERITY_COLOR: Record<string, string> = {
  info:     'var(--color-aqi-good)',
  warning:  'var(--color-aqi-elevated)',
  critical: 'var(--color-aqi-critical)',
};

export function Badge({ level, severity, label }: BadgeProps) {
  const bg = level
    ? colorFromLevel(level)
    : severity
    ? SEVERITY_COLOR[severity]
    : 'var(--color-surface-subtle)';

  const badgeStyle = {
    display:       'inline-flex',
    alignItems:    'center',
    padding:       '2px 8px',
    borderRadius:  '999px',
    fontSize:      '12px',
    fontWeight:    600,
    letterSpacing: '0.02em',
    background:    bg,
    color:         '#fff',
    whiteSpace:    'nowrap',
  } as const;

  return (
    <span style={badgeStyle}>
      {label}
    </span>
  );
}
