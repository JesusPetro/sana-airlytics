import type { ReactNode } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/landing/ThemeToggle';
import { LangToggle }  from '@/components/landing/LangToggle';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AuthLayout({ children, params }: Props) {
  const { locale } = await params;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 h-14 shrink-0">
        <Link href={`/${locale}`} className="flex items-baseline gap-0.5 select-none">
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>
            SANA
          </span>
          <span className="text-lg font-light tracking-tight text-[var(--color-text-primary)]">
            Airlytics
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>

      {/* Centered form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        {children}
      </div>
    </div>
  );
}
