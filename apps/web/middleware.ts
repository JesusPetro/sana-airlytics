import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  if (response.status === 307 || response.status === 308 || response.status === 301 || response.status === 302) {
    const location = response.headers.get('location');
    if (location) {
      try {
        const url = new URL(location);
        const forwardedHost = request.headers.get('x-forwarded-host');
        const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
        if (forwardedHost) {
          url.hostname = forwardedHost.split(':')[0];
          url.protocol = forwardedProto + ':';
          url.port = '';
          return NextResponse.redirect(url.toString(), { status: response.status });
        }
      } catch {}
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
