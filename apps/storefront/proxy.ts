import { evaluateRoleGuard } from "@repo/api/route-guards";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export function proxy(req: NextRequest) {
  const guard = evaluateRoleGuard({
    app: "storefront",
    cookies: req.cookies,
    pathname: req.nextUrl.pathname,
  });

  if (guard.action === "redirect") {
    return NextResponse.redirect(new URL(guard.destination));
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/", "/(en|es|fr)/:path*"],
};
