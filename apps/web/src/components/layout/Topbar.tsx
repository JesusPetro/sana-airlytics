import Link from 'next/link';
import { WorkspacePill } from './WorkspacePill';
import { RangePills } from '@/components/ui/RangePills';

interface TopbarProps {
  locale: string;
}

export function Topbar({ locale }: TopbarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 flex items-center justify-between px-4"
      style={{
        height: 'var(--topbar-h)',
        zIndex: 50,
        background: 'color-mix(in srgb, var(--color-surface) 95%, transparent)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      {/* Left — Logo + Workspace */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}`}
          className="flex items-baseline gap-0.5 select-none"
          aria-label="SANA Airlytics home"
        >
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: 'var(--color-primary)' }}
          >
            SANA
          </span>
          <span
            className="text-base font-light tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Airlytics
          </span>
        </Link>

        <WorkspacePill />
      </div>

      {/* Right — Range pills */}
      <RangePills />
    </header>
  );
}
