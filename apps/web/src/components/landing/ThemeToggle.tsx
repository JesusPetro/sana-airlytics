'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

const CYCLE: Theme[] = ['light', 'dark', 'system'];

const ICONS: Record<Theme, React.ComponentType<{ size?: number }>> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const LABELS: Record<Theme, string> = {
  light: 'Switch to dark mode',
  dark: 'Switch to system theme',
  system: 'Switch to light mode',
};

function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === 'dark') {
    root.classList.add('dark');
  } else if (t === 'light') {
    root.classList.remove('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    prefersDark ? root.classList.add('dark') : root.classList.remove('dark');
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme | null) ?? 'system';
    setTheme(stored);
    applyTheme(stored);
    setMounted(true);

    if (stored === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        if ((localStorage.getItem('theme') ?? 'system') === 'system') {
          e.matches
            ? document.documentElement.classList.add('dark')
            : document.documentElement.classList.remove('dark');
        }
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length];

    const rect = e.currentTarget.getBoundingClientRect();
    const x = `${Math.round(rect.left + rect.width / 2)}px`;
    const y = `${Math.round(rect.top + rect.height / 2)}px`;
    document.documentElement.style.setProperty('--vt-x', x);
    document.documentElement.style.setProperty('--vt-y', y);

    const apply = () => {
      applyTheme(next);
      setTheme(next);
      localStorage.setItem('theme', next);
    };

    if ('startViewTransition' in document) {
      (document as Document & { startViewTransition(cb: () => void): void })
        .startViewTransition(apply);
    } else {
      apply();
    }
  }

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg" />
    );
  }

  const Icon = ICONS[theme];

  return (
    <button
      onClick={handleClick}
      aria-label={LABELS[theme]}
      className="flex items-center justify-center w-9 h-9 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)] transition-colors cursor-pointer"
    >
      <Icon size={18} />
    </button>
  );
}
