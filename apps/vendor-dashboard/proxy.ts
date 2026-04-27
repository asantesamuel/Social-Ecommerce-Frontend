import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hasToken = req.cookies.has('refreshToken');
  
  // Normalize the pathname to check what page we are on
  const isAuthPage = url.pathname.includes('/login') || url.pathname.includes('/signup');

  // Let Next-Intl handle the initial i18n redirect rules
  const res = intlMiddleware(req);

  // If there's no auth token, redirect to login
  if (!hasToken && !isAuthPage) {
    const localeMatch = url.pathname.match(/^\/(en|es|fr)/);
    const locale = localeMatch ? localeMatch[1] : 'en';

    url.protocol = 'http:';
    url.hostname = 'localhost';
    url.port = '3001';
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(en|es|fr)/:path*']
};
