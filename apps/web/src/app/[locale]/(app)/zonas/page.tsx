'use client';

import dynamic from 'next/dynamic';

const ZonesPage = dynamic(
  () => import('@/components/zones/ZonesPage').then((m) => m.ZonesPage),
  { ssr: false },
);

export default function ZonasPage() {
  return (
    <div style={{
      position: 'fixed',
      top: 'var(--topbar-h)',
      left: 'var(--sidebar-current-w, var(--sidebar-w-collapsed))',
      right: 0,
      bottom: 0,
      zIndex: 10,
    }}>
      <ZonesPage />
    </div>
  );
}
