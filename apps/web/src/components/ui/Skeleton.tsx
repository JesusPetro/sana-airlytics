import type { CSSProperties } from 'react';

interface SkelProps {
  w?: number | string;
  h?: number | string;
  r?: number | string;
  style?: CSSProperties;
}

export function Skel({ w = '100%', h = 12, r = 6, style }: SkelProps) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: 'var(--color-surface-2)',
        animation: 'skelPulse 1.5s ease-in-out infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
