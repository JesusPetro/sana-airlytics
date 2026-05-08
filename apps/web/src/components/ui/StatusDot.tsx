import type { SensorStatus } from '@/types/sensor';

const COLOR: Record<SensorStatus, string> = {
  ACTIVE:   'var(--color-status-online)',
  PENDING:  'var(--color-status-pending)',
  INACTIVE: 'var(--color-status-offline)',
};

export function StatusDot({ status }: { status: SensorStatus }) {
  const color = COLOR[status];

  return (
    <span
      style={{
        display:      'inline-block',
        width:        '8px',
        height:       '8px',
        borderRadius: '50%',
        background:   color,
        flexShrink:   0,
        animation:    status === 'ACTIVE' ? 'pulse 2s ease-in-out infinite' : undefined,
      }}
      aria-label={status}
    />
  );
}
