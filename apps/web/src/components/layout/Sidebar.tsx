'use client';

import { useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/nav';

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
        overflow: 'hidden',
        // Hide until localStorage is read to prevent flash
        visibility: mounted ? 'visible' : 'hidden',
      }}
    >
      {/* Nav items */}
      <nav className="flex-1 py-3 px-2">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
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
      </nav>

      {/* Bottom — collapse toggle */}
      <div
        className="flex-shrink-0 flex items-center py-3 px-2"
        style={{ borderTop: '1px solid var(--color-border-subtle)' }}
      >
        <button
          onClick={toggle}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--color-text-disabled)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              'var(--color-surface-subtle)';
            (e.currentTarget as HTMLButtonElement).style.color =
              'var(--color-text-secondary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color =
              'var(--color-text-disabled)';
          }}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </aside>
  );
}
