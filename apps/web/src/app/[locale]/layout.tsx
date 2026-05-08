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

export const metadata: Metadata = {
  title: 'SANA Airlytics',
  description: 'Plataforma de monitoreo de calidad del aire en tiempo real',
};

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <div className={`${jetbrainsMono.variable} h-full antialiased font-sans`}>
      <LocaleSetter locale={locale} />
      <NextIntlClientProvider messages={messages}>
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
