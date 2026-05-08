import { setRequestLocale } from 'next-intl/server';
import { SignupForm } from '@/components/auth/SignupForm';

type Props = { params: Promise<{ locale: string }> };

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SignupForm locale={locale as 'en' | 'es'} />;
}
