import { getTranslations } from 'next-intl/server';

export async function LandingFooter() {
  const t = await getTranslations('landing.footer');

  return (
    <footer
      className="flex flex-col items-center justify-center px-6 text-center"
      style={{
        minHeight:  '100vh',
        borderTop:  '1px solid var(--color-border)',
        background: 'var(--color-bg)',
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-3">
        {/* Logo */}
        <div className="flex items-baseline gap-0.5 select-none mb-1">
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: 'var(--color-primary)' }}
          >
            SANA
          </span>
          <span
            className="text-lg font-light tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Airlytics
          </span>
        </div>

        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {t('tagline')}
        </p>

        <p className="text-xs" style={{ color: 'var(--color-text-disabled)' }}>
          {t('copyright')}
        </p>
      </div>
    </footer>
  );
}
