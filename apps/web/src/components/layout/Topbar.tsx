'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { WorkspacePill } from './WorkspacePill';
import { ThemeToggle } from '@/components/landing/ThemeToggle';
import { LangToggle } from '@/components/landing/LangToggle';
import { useMobileNav } from '@/context/MobileNavContext';

interface TopbarProps {
  locale: string;
}

export function Topbar({ locale }: TopbarProps) {
  const { toggle } = useMobileNav();

  return (
    <header
      className="fixed top-0 left-0 right-0 flex items-center gap-3 px-4"
      style={{
        height: 'var(--topbar-h)',
        zIndex: 1201,
        background: 'color-mix(in srgb, var(--color-surface) 95%, transparent)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      {/* Hamburger — solo móvil */}
      <button
        onClick={toggle}
        className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
        style={{
          background: 'none',
          border:     'none',
          cursor:     'pointer',
          color:      'var(--color-text-secondary)',
        }}
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {/* Left — Logo + Workspace */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href={`/${locale}`}
          className="flex items-baseline gap-0.5 select-none flex-shrink-0"
          aria-label="SANA Airlytics home"
        >
          <span className="text-base font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>
            SANA
          </span>
          <span className="text-base font-light tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Airlytics
          </span>
        </Link>

        <WorkspacePill />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right — Lang + Theme */}
      <LangToggle />
      <ThemeToggle />
    </header>
  );
}
