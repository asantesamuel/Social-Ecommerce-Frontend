import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function proxy(req: NextRequest) {
  const hasToken = req.cookies.has('refreshToken');
  const isAuthPage =
    req.nextUrl.pathname.includes('/login') ||
    req.nextUrl.pathname.includes('/signup');

  if (!hasToken && !isAuthPage) {
    const locale = req.nextUrl.pathname.match(/^\/(en|es|fr)/)?.[1] ?? 'en';
    const loginUrl = new URL(`/${locale}/login`, 'http://localhost:3001');
    return NextResponse.redirect(loginUrl);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/', '/(en|es|fr)/:path*'],
};
