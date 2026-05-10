import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sana-airlytics.utb.edu.co';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/es/', '/en/', '/es/login', '/en/login', '/es/register', '/en/register', '/es/reset-password', '/en/reset-password'],
      disallow: [
        '/api/',
        '/es/dashboard',
        '/en/dashboard',
        '/es/alertas',
        '/en/alertas',
        '/es/dispositivos',
        '/en/dispositivos',
        '/es/mapa',
        '/en/mapa',
        '/es/settings',
        '/en/settings',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
