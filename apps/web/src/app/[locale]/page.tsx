import { LandingNav }      from '@/components/landing/LandingNav';
import { HeroSection }     from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { LandingFooter }   from '@/components/landing/LandingFooter';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <LandingNav locale={locale} />

      <main>
        <HeroSection locale={locale} />
        <FeaturesSection />
      </main>

      <LandingFooter />
    </>
  );
}
