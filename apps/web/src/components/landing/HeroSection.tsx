'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MapAnimation } from './MapAnimation';
import { ParamChips }   from './ParamChips';

export function HeroSection({ locale }: { locale: string }) {
  const t = useTranslations('landing.hero');

  return (
    <section
      style={{
        position: 'relative',
        width:    '100%',
        height:   '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Map — fullscreen background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapAnimation />
      </div>

      {/* Gradient overlay — legibility at bottom */}
      <div
        aria-hidden="true"
        style={{
          position:      'absolute',
          inset:         0,
          zIndex:        1,
          pointerEvents: 'none',
          background:    'linear-gradient(to bottom, transparent 35%, rgba(7,11,20,0.55) 65%, rgba(7,11,20,0.82) 100%)',
        }}
      />

      {/* Content — anchored bottom-left */}
      <div
        style={{
          position:      'absolute',
          bottom:        0,
          left:          0,
          right:         0,
          zIndex:        2,
          padding:       'clamp(32px, 5vw, 64px)',
          paddingBottom: 'clamp(40px, 6vw, 72px)',
        }}
      >
        {/* Headline */}
        <h1
          className="font-semibold leading-[1.05] tracking-tight mb-5"
          style={{
            fontSize:   'clamp(2.4rem, 6vw, 5rem)',
            color:      '#ffffff',
            textShadow: '0 2px 24px rgba(0,0,0,0.35)',
            maxWidth:   '720px',
          }}
        >
          {t('title')}
          <br />
          <span className="dark:text-[#93b4ff] text-[#2563eb]">{t('titleHighlight')}</span>
        </h1>

        {/* Param chips */}
        <div className="mb-7">
          <ParamChips />
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'var(--color-primary)',
              boxShadow:  '0 0 32px rgba(21,93,252,0.4)',
            }}
          >
            {t('cta_primary')}
            <span aria-hidden>→</span>
          </Link>

          <a
            href="#features"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{
              color:               'rgba(255,255,255,0.85)',
              border:              '1px solid rgba(255,255,255,0.2)',
              background:          'rgba(255,255,255,0.08)',
              backdropFilter:      'blur(8px)',
              WebkitBackdropFilter:'blur(8px)',
            }}
          >
            {t('cta_secondary')}
          </a>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        style={{
          position:      'absolute',
          bottom:        '28px',
          right:         'clamp(32px, 5vw, 64px)',
          zIndex:        2,
          color:         'rgba(255,255,255,0.45)',
          fontSize:      '12px',
          fontFamily:    'var(--font-mono)',
          letterSpacing: 'normal',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           '4px',
        }}
      >
        <span className="animate-[slideIn_0.6s_cubic-bezier(0.16,1,0.3,1)_both]" style={{ fontSize: '16px', opacity: 0.6 }}>↓</span>
        scroll
      </div>
    </section>
  );
}
