import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SignupForm } from '@/components/auth/SignupForm';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'en' ? 'Create account' : 'Crear cuenta',
    description: locale === 'en'
      ? 'Create your SANA Airlytics account and start monitoring air quality across your sensor network.'
      : 'Crea tu cuenta en SANA Airlytics y comienza a monitorear la calidad del aire en tu red de sensores.',
  };
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SignupForm locale={locale as 'en' | 'es'} />;
}
