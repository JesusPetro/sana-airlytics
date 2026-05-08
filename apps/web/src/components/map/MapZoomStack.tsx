'use client';

import { useMap } from 'react-leaflet';

export function MapZoomStack() {
  const map = useMap();

  const btnStyle = (top?: boolean, bottom?: boolean): React.CSSProperties => ({
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: top ? '8px 8px 0 0' : bottom ? '0 0 8px 8px' : '0',
    borderTop: top ? undefined : 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 400,
    color: 'var(--color-text-primary)',
    lineHeight: 1,
    transition: 'background 0.12s',
  });

  return (
    <div style={{
      position: 'absolute',
      top: '12px',
      right: '12px',
      zIndex: 1000,
      boxShadow: 'var(--shadow-sm)',
      borderRadius: '8px',
    }}>
      <button
        style={btnStyle(true)}
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
      >
        +
      </button>
      <button
        style={btnStyle(false, true)}
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
      >
        −
      </button>
    </div>
  );
}
