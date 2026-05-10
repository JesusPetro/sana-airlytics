import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sana-airlytics.utb.edu.co';
  const locales = routing.locales;

  const publicRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '',                priority: 1.0, changeFrequency: 'weekly' },
    { path: '/login',          priority: 0.6, changeFrequency: 'monthly' },
    { path: '/register',       priority: 0.6, changeFrequency: 'monthly' },
    { path: '/reset-password', priority: 0.4, changeFrequency: 'monthly' },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const { path, priority, changeFrequency } of publicRoutes) {
    const languages = Object.fromEntries(
      locales.map((locale) => [locale, `${base}/${locale}${path}`]),
    ) as Record<string, string>;
    languages['x-default'] = `${base}/${routing.defaultLocale}${path}`;

    entries.push({
      url: `${base}/${routing.defaultLocale}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: { languages },
    });
  }

  return entries;
}
