import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ThemeToggle } from './ThemeToggle';
import { LangToggle } from './LangToggle';

export async function LandingNav({ locale }: { locale: string }) {
  const t = await getTranslations('landing.nav');

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14"
      style={{
        background: 'color-mix(in srgb, var(--color-bg) 80%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      {/* Logo */}
      <Link
        href={`/${locale}`}
        className="flex items-baseline gap-0.5 select-none"
        aria-label="SANA Airlytics home"
      >
        <span
          className="text-xl font-bold tracking-tight"
          style={{ color: 'var(--color-primary)' }}
        >
          SANA
        </span>
        <span
          className="text-xl font-light tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Airlytics
        </span>
      </Link>

      {/* Controls */}
      <nav className="flex items-center gap-3">
        <LangToggle />
        <ThemeToggle />
        <Link
          href={`/${locale}/login`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
          style={{ background: 'var(--color-primary)' }}
        >
          {t('cta')}
          <span aria-hidden>→</span>
        </Link>
      </nav>
    </header>
  );
}
