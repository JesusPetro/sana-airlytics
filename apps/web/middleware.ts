import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const port = request.headers.get('x-forwarded-port');

  const url = request.nextUrl.clone();
  if (host) {
    url.hostname = host.split(':')[0];
    url.protocol = proto;
    url.port = port && port !== '443' && port !== '80' ? port : '';
  }

  const rewritten = new NextRequest(url, request);
  return intlMiddleware(rewritten);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
