'use client';

import dynamic from 'next/dynamic';

const MapStage = dynamic(
  () => import('@/components/map/MapStage').then((m) => m.MapStage),
  { ssr: false },
);

export default function MapaPage() {
  return (
    <div style={{
      position: 'fixed',
      top: 'var(--topbar-h)',
      left: 'var(--sidebar-current-w, var(--sidebar-w-collapsed))',
      right: 0,
      bottom: 0,
      zIndex: 10,
    }}>
      <MapStage />
    </div>
  );
}
