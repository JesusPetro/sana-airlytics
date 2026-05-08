'use client';

import dynamic from 'next/dynamic';

const MapStage = dynamic(
  () => import('@/components/map/MapStage').then((m) => m.MapStage),
  { ssr: false },
);

export default function MapaPage() {
  return (
    <div style={{ position: 'fixed', inset: 0, top: 'var(--topbar-h)', paddingLeft: 'var(--sidebar-current-w, var(--sidebar-w-collapsed))' }}>
      <MapStage />
    </div>
  );
}
