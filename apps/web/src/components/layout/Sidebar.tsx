'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, LogOut, User, Trash2 } from 'lucide-react';
import { ProfileSheet } from '@/components/profile/ProfileSheet';
import { NAV_ITEMS } from '@/lib/nav';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { roleLevel } from '@/lib/roles';

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
  const [popoverOpen,   setPopoverOpen]   = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const t = useTranslations();
  const { user, logout } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const router = useRouter();

  const MIN_LEVELS: Record<string, number> = { editor: 1, admin: 2 };
  const visibleItems = (bottom: boolean) =>
    NAV_ITEMS.filter((i) => {
      if (!!i.bottomSection !== bottom) return false;
      if (!i.minRole) return true;
      return roleLevel(activeWorkspace) >= MIN_LEVELS[i.minRole];
    });

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

  useEffect(() => {
    if (!popoverOpen) return;
    function handleOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [popoverOpen]);

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
          {visibleItems(false).map((item) => {
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
          {visibleItems(true).map((item) => {
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

      {user && (
        <div
          ref={popoverRef}
          style={{
            borderTop: '1px solid var(--color-border-subtle)',
            padding: '8px',
            position: 'relative',
          }}
        >
          {/* Popover menu */}
          {popoverOpen && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 6px)',
              left: '8px',
              right: '8px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-md)',
              zIndex: 50,
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}>
              {/* Info del usuario en el popover */}
              <div style={{
                padding: '8px 10px 6px',
                borderBottom: '1px solid var(--color-border-subtle)',
                marginBottom: '2px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>

              {/* Editar perfil */}
              <button
                onClick={() => { setPopoverOpen(false); setProfileOpen(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '7px 10px',
                  background: 'none', border: 'none',
                  borderRadius: '7px', cursor: 'pointer',
                  fontSize: '13px', color: 'var(--color-text-primary)',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <User size={15} />
                {t('nav.profile')}
              </button>

              {/* Cerrar sesion */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '7px 10px',
                  background: 'none', border: 'none',
                  borderRadius: '7px', cursor: 'pointer',
                  fontSize: '13px', color: 'var(--color-text-secondary)',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <LogOut size={15} />
                {t('profile.logout')}
              </button>
            </div>
          )}

          {/* Trigger: bloque del usuario */}
          <button
            onClick={() => setPopoverOpen((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: expanded ? '6px 8px' : '6px 0',
              justifyContent: expanded ? 'flex-start' : 'center',
              borderRadius: '8px',
              width: '100%',
              background: popoverOpen ? 'var(--color-surface-subtle)' : 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 140ms',
            }}
            onMouseEnter={(e) => { if (!popoverOpen) e.currentTarget.style.background = 'var(--color-surface-subtle)'; }}
            onMouseLeave={(e) => { if (!popoverOpen) e.currentTarget.style.background = 'none'; }}
          >
            {/* Avatar */}
            <span style={{
              flexShrink: 0,
              width: '28px', height: '28px',
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.02em',
            }}>
              {initials(user.email) || '?'}
            </span>

            {/* Email — visible solo cuando expandido */}
            <span style={{
              overflow: 'hidden',
              opacity: expanded ? 1 : 0,
              maxWidth: expanded ? '160px' : '0px',
              transition: 'opacity 200ms, max-width 200ms',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              textAlign: 'left',
            }}>
              {user.email}
            </span>
          </button>

          {/* ProfileSheet */}
          <ProfileSheet
            isOpen={profileOpen}
            onClose={() => setProfileOpen(false)}
            locale={locale}
          />
        </div>
      )}
    </aside>
  );
}
