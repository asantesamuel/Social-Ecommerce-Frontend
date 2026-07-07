import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);
const storefrontUrl =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3001";

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hasToken = req.cookies.has("refreshToken");

  // Normalize the pathname to check what page we are on
  const isAuthPage =
    url.pathname.includes("/login") || url.pathname.includes("/signup");

  // Let Next-Intl handle the initial i18n redirect rules
  const res = intlMiddleware(req);

  // If there's no auth token, redirect to login
  if (!hasToken && !isAuthPage) {
    // If we're at the root, Next-Intl redirects to /en automatically. We just force /en/login
    // Alternatively, let Next-Intl dictate the locale and insert /login
    const localeMatch = url.pathname.match(/^\/(en|es|fr)/);
    const locale = localeMatch ? localeMatch[1] : "en";

    return NextResponse.redirect(new URL(`/${locale}/login`, storefrontUrl));
  }

  return res;
}

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(en|es|fr)/:path*"],
};
