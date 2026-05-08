'use client';

import { usePathname, useRouter } from 'next/navigation';

const LOCALES = ['en', 'es'] as const;
type Locale = (typeof LOCALES)[number];

function localeFromPath(path: string): Locale {
  if (path.startsWith('/en')) return 'en';
  return 'es';
}

export function LangToggle() {
  const pathname  = usePathname();
  const router    = useRouter();
  const active    = localeFromPath(pathname);

  function switchTo(next: Locale) {
    if (next === active) return;
    const rest    = pathname.replace(/^\/(en|es)/, '') || '/';
    const newPath = `/${next}${rest === '/' ? '' : rest}`;
    const navigate = () => router.push(newPath, { scroll: false });

    if (!document.startViewTransition) { navigate(); return; }

    document.documentElement.dataset.vtLang = '';
    const t = document.startViewTransition(navigate);
    t.finished.finally(() => delete document.documentElement.dataset.vtLang);
  }

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--color-surface-subtle)]">
      {LOCALES.map((lang) => (
        <button
          key={lang}
          onClick={() => switchTo(lang)}
          className={[
            'px-2.5 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer',
            active === lang
              ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm font-medium'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
          ].join(' ')}
          aria-label={`Switch to ${lang === 'en' ? 'English' : 'Spanish'}`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
