import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_ROLE_COOKIE,
} from "./cookies";
import { getLocaleFromPath } from "./config";
import { getRequiredRoleForApp, normalizeUserRole, type ProtectedApp } from "./roles";

type CookieValue = { value: string } | undefined;

export type AuthCookieReader = {
  get(name: string): CookieValue;
  has(name: string): boolean;
};

export type RouteGuardResult =
  | { action: "allow" }
  | {
      action: "redirect";
      destination: string;
      reason: "missing-session" | "wrong-role";
    };

export const evaluateRoleGuard = ({
  app,
  cookies,
  pathname,
  search = "",
}: {
  app: ProtectedApp;
  cookies: AuthCookieReader;
  pathname: string;
  search?: string;
}): RouteGuardResult => {
  // The guard is only navigation UX; backend authorization remains authoritative.
  if (pathname.startsWith("/auth/") || pathname.startsWith("/api/")) {
    return { action: "allow" };
  }

  const locale = getLocaleFromPath(pathname);
  const sessionPresent = cookies.has(ACCESS_TOKEN_COOKIE) || cookies.has(REFRESH_TOKEN_COOKIE);

  if (app === "storefront") {
    const cartRoute = /^\/(en|es|fr)\/cart(?:\/|$)/.test(pathname);
    if (!cartRoute || sessionPresent) return { action: "allow" };
    return {
      action: "redirect",
      destination: `/${locale}/login?returnTo=${encodeURIComponent(pathname + search)}`,
      reason: "missing-session",
    };
  }

  if (!sessionPresent) {
    const returnTo = pathname === "/" ? `/${locale}` : pathname + search;
    return {
      action: "redirect",
      destination: `/auth/start?returnTo=${encodeURIComponent(returnTo)}`,
      reason: "missing-session",
    };
  }

  const role = normalizeUserRole(cookies.get(USER_ROLE_COOKIE)?.value);
  if (role && role !== getRequiredRoleForApp(app)) {
    return {
      action: "redirect",
      destination: "/auth/failed?reason=wrong-role",
      reason: "wrong-role",
    };
  }

  return { action: "allow" };
};
