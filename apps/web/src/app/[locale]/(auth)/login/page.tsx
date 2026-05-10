import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { LoginForm } from '@/components/auth/LoginForm';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'en' ? 'Sign in' : 'Iniciar sesión',
    description: locale === 'en'
      ? 'Sign in to your SANA Airlytics account to monitor air quality in real time.'
      : 'Inicia sesión en tu cuenta de SANA Airlytics para monitorear la calidad del aire en tiempo real.',
  };
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoginForm locale={locale as 'en' | 'es'} />;
}
