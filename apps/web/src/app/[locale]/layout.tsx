import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { LocaleSetter } from '@/components/LocaleSetter';
import '@/styles/globals.css';

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sana-airlytics.utb.edu.co';

const COPY = {
  es: {
    description: 'Plataforma de monitoreo de calidad del aire en tiempo real. Rastrea PM2.5, CO₂, VOCs y más con múltiples nodos sensores en Cartagena.',
    ogLocale: 'es_CO',
    altLocale: 'en_US',
  },
  en: {
    description: 'Real-time air quality monitoring platform. Track PM2.5, CO₂, VOCs and more from multiple sensor nodes across Cartagena, Colombia.',
    ogLocale: 'en_US',
    altLocale: 'es_CO',
  },
} as const;

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.es;

  return {
    title: {
      default: 'SANA Airlytics',
      template: '%s | SANA Airlytics',
    },
    description: copy.description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        es: '/es',
        en: '/en',
        'x-default': `/${routing.defaultLocale}`,
      },
    },
    openGraph: {
      title: 'SANA Airlytics',
      description: copy.description,
      url: `${BASE_URL}/${locale}`,
      siteName: 'SANA Airlytics',
      locale: copy.ogLocale,
      alternateLocale: [copy.altLocale],
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'SANA Airlytics',
      description: copy.description,
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SANA Airlytics',
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.png`,
    description: COPY[locale as keyof typeof COPY]?.description ?? COPY.es.description,
    foundingDate: '2025',
    areaServed: { '@type': 'City', name: 'Cartagena', addressCountry: 'CO' },
  };

  return (
    <div className={`${jetbrainsMono.variable} h-full antialiased font-sans`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <LocaleSetter locale={locale} />
      <NextIntlClientProvider messages={messages}>
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
