'use client';

import { useRef, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function initials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function UserFab() {
  const { user, logout } = useAuth();
  const { locale }       = useParams<{ locale: string }>();
  const router           = useRouter();
  const [open, setOpen]  = useState(false);
  const ref              = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.push(`/${locale}/login`);
  }

  return (
    <div ref={ref} style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 200 }}>
      {/* Menu */}
      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
          minWidth: '220px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          boxShadow: 'var(--shadow-lg)',
          padding: '4px',
          overflow: 'hidden',
        }}>
          {/* User info */}
          <div style={{
            padding: '10px 12px 8px',
            borderBottom: '1px solid var(--color-border-subtle)',
            marginBottom: '4px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, fontFamily: 'monospace' }}>
              {user.user_id.slice(0, 12)}…
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              width: '100%', padding: '8px 12px',
              fontSize: '13px', color: 'var(--color-aqi-critical)',
              background: 'none', border: 'none', cursor: 'pointer',
              borderRadius: '7px', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <LogOut size={14} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--color-primary)',
          border: '2px solid var(--color-surface)',
          boxShadow: '0 2px 12px rgba(21,93,252,0.4)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 700, color: '#fff',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        aria-label="User menu"
      >
        {initials(user.email) || '?'}
      </button>
    </div>
  );
}
