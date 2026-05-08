import { getTranslations } from 'next-intl/server';
import { Activity, Layers, BellDot } from 'lucide-react';

const FEATURES = [
  { key: 'realtime',    Icon: Activity, color: 'var(--color-primary)'       },
  { key: 'versatility', Icon: Layers,   color: 'var(--color-accent-teal)'   },
  { key: 'alerts',      Icon: BellDot,  color: 'var(--color-aqi-elevated)'  },
] as const;

export async function FeaturesSection() {
  const t = await getTranslations('landing.features');

  return (
    <section
      id="features"
      className="flex flex-col justify-center px-6"
      style={{ background: 'var(--color-surface-subtle)', minHeight: '100vh' }}
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2
            className="text-3xl lg:text-4xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {t('sectionTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(({ key, Icon, color }) => (
            <div
              key={key}
              className="flex flex-col gap-5 p-8 rounded-2xl"
              style={{
                background: 'var(--color-surface)',
                border:     '1px solid var(--color-border)',
                boxShadow:  'var(--shadow-sm)',
              }}
            >
              <div
                className="flex items-center justify-center w-12 h-12 rounded-2xl"
                style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}
              >
                <Icon size={24} strokeWidth={1.8} style={{ color }} />
              </div>

              <div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {t(`${key}.title`)}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {t(`${key}.desc`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
