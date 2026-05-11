import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SANA Airlytics',
    short_name: 'SANA',
    description: 'Plataforma de monitoreo de calidad del aire en tiempo real',
    start_url: '/es',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#155dfc',
    icons: [
      {
        src: '/favicon.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
  };
}
