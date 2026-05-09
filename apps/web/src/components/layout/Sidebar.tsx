'use client';

import { useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/nav';
import { useAuth } from '@/context/AuthContext';

function initials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

const STORAGE_KEY = 'sidebar-expanded';
const ALERT_COUNT = 0; // hardcoded until API integration in Phase 2

function setSidebarCssVar(expanded: boolean) {
  document.documentElement.style.setProperty(
    '--sidebar-current-w',
    expanded ? 'var(--sidebar-w-expanded)' : 'var(--sidebar-w-collapsed)',
  );
}

interface SidebarProps {
  locale: string;
}

export function Sidebar({ locale }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const t = useTranslations();
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push(`/${locale}/login`);
  }

  useLayoutEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const isExpanded = stored === null ? true : stored === 'true';
    setExpanded(isExpanded);
    setSidebarCssVar(isExpanded);
    setMounted(true);
  }, []);

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    setSidebarCssVar(next);
  }

  return (
    <aside
      className="fixed flex flex-col"
      style={{
        top: 'var(--topbar-h)',
        left: 0,
        height: 'calc(100vh - var(--topbar-h))',
        width: expanded ? 'var(--sidebar-w-expanded)' : 'var(--sidebar-w-collapsed)',
        zIndex: 40,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border-subtle)',
        transition: 'width 200ms ease',
        // Hide until localStorage is read to prevent flash
        visibility: mounted ? 'visible' : 'hidden',
      }}
    >
      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 flex flex-col justify-between">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.filter((i) => !i.bottomSection).map((item) => {
            const isActive = pathname.includes(item.href);
            const Icon = item.icon;
            const label = t(item.labelKey);
            const hasBadge = item.badge === 'alertCount' && ALERT_COUNT > 0;

            return (
              <li key={item.id} className="group relative">
                <Link
                  href={`/${locale}${item.href}`}
                  className="flex items-center rounded-[10px] transition-colors duration-150"
                  style={{
                    padding: expanded ? '10px 12px' : '10px 0',
                    justifyContent: expanded ? 'flex-start' : 'center',
                    gap: expanded ? '12px' : '0',
                    background: isActive ? 'var(--color-primary-surface)' : 'transparent',
                    color: isActive
                      ? 'var(--color-primary)'
                      : 'var(--color-text-secondary)',
                    fontWeight: isActive ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        'var(--color-surface-subtle)';
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        'var(--color-text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        'var(--color-text-secondary)';
                    }
                  }}
                >
                  {/* Icon + optional badge dot when collapsed */}
                  <span className="relative flex-shrink-0">
                    <Icon size={20} />
                    {!expanded && hasBadge && (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                        style={{ background: '#EF4444' }}
                      />
                    )}
                  </span>

                  {/* Label — fades in/out */}
                  <span
                    className="overflow-hidden whitespace-nowrap text-sm transition-all duration-200"
                    style={{
                      opacity: expanded ? 1 : 0,
                      maxWidth: expanded ? '200px' : '0px',
                    }}
                  >
                    {label}
                  </span>

                  {/* Badge count when expanded */}
                  {expanded && hasBadge && (
                    <span
                      className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full"
                      style={{
                        background: '#EF4444',
                        color: '#fff',
                        fontSize: '10px',
                        lineHeight: 1,
                      }}
                    >
                      {ALERT_COUNT}
                    </span>
                  )}
                </Link>

                {/* Tooltip when collapsed */}
                {!expanded && (
                  <span
                    className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2
                      px-2.5 py-1.5 text-xs rounded-lg whitespace-nowrap
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={{
                      zIndex: 60,
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    {label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {/* Bottom nav items (Settings) */}
        <ul className="flex flex-col gap-0.5" style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '8px', marginTop: '8px' }}>
          {NAV_ITEMS.filter((i) => i.bottomSection).map((item) => {
            const isActive = pathname.includes(item.href);
            const Icon = item.icon;
            const label = t(item.labelKey);
            return (
              <li key={item.id} className="group relative">
                <Link
                  href={`/${locale}${item.href}`}
                  className="flex items-center rounded-[10px] transition-colors duration-150"
                  style={{
                    padding: expanded ? '10px 12px' : '10px 0',
                    justifyContent: expanded ? 'flex-start' : 'center',
                    gap: expanded ? '12px' : '0',
                    background: isActive ? 'var(--color-primary-surface)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: isActive ? 600 : 400,
                  }}
                  onMouseEnter={(e) => { if (!isActive) { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-surface-subtle)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-primary)'; } }}
                  onMouseLeave={(e) => { if (!isActive) { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-secondary)'; } }}
                >
                  <span className="relative flex-shrink-0"><Icon size={20} /></span>
                  <span className="overflow-hidden whitespace-nowrap text-sm transition-all duration-200" style={{ opacity: expanded ? 1 : 0, maxWidth: expanded ? '200px' : '0px' }}>
                    {label}
                  </span>
                </Link>
                {!expanded && (
                  <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={{ zIndex: 60, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', boxShadow: 'var(--shadow-md)' }}>
                    {label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle — shadcn-style pill floating just outside the sidebar edge */}
      <button
        onClick={toggle}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        style={{
          position: 'absolute',
          top: '20px',
          right: '-16px',
          zIndex: 50,
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '50%',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          boxShadow: 'var(--shadow-sm)',
          transition: 'background 140ms, color 140ms, box-shadow 140ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-surface-subtle)';
          e.currentTarget.style.color = 'var(--color-text-primary)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--color-surface)';
          e.currentTarget.style.color = 'var(--color-text-secondary)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        {expanded ? <ChevronLeft size={11} /> : <ChevronRight size={11} />}
      </button>

      {/* User account — very last element, flush to bottom */}
      {user && (
        <div
          style={{
            borderTop: '1px solid var(--color-border-subtle)',
            padding: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: expanded ? '6px 8px' : '6px 0',
              justifyContent: expanded ? 'flex-start' : 'center',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {/* Avatar */}
            <span
              style={{
                flexShrink: 0,
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              {initials(user.email) || '?'}
            </span>

            {/* Email */}
            <span
              style={{
                overflow: 'hidden',
                opacity: expanded ? 1 : 0,
                maxWidth: expanded ? '160px' : '0px',
                transition: 'opacity 200ms ease 60ms, max-width 200ms ease',
                flex: 1,
                minWidth: 0,
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              {user.email}
            </span>

            {/* Logout */}
            {expanded && (
              <button
                onClick={handleLogout}
                style={{
                  flexShrink: 0,
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-disabled)',
                  transition: 'background 140ms, color 140ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-surface-subtle)';
                  e.currentTarget.style.color = '#EF4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-disabled)';
                }}
                title="Cerrar sesión"
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
