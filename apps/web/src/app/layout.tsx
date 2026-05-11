import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  icons: { icon: '/favicon_utb.ico' },
};

const themeScript = `(function(){var t=localStorage.getItem('theme')||'system';var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||(t==='system'&&d))document.documentElement.classList.add('dark');})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
