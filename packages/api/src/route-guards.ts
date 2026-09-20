import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_ROLE_COOKIE,
} from "./cookies";
import { buildLocalizedAppUrl, getLocaleFromPath } from "./config";
import {
  getRequiredRoleForApp,
  getRoleLandingUrl,
  normalizeUserRole,
  type ProtectedApp,
} from "./roles";
import type { UserRole } from "./types";

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
      reason: "auth-page" | "missing-session" | "missing-role" | "wrong-role";
    };

const AUTH_ROUTE_SEGMENTS = new Set(["login", "signup"]);

const getCookieValue = (
  cookies: AuthCookieReader,
  cookieName: string,
): string | undefined => cookies.get(cookieName)?.value;

const decodeBase64Url = (value: string): string | undefined => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  try {
    return globalThis.atob(padded);
  } catch {
    return undefined;
  }
};

const getRoleFromJwtPayload = (payload: Record<string, unknown>) => {
  const roleCandidates = [
    payload.role,
    payload.roles,
    payload.authorities,
    payload.scope,
    (payload.user as Record<string, unknown> | undefined)?.role,
  ];

  for (const candidate of roleCandidates) {
    if (Array.isArray(candidate)) {
      const role = candidate.map(normalizeUserRole).find(Boolean);
      if (role) {
        return role;
      }
    }

    if (typeof candidate === "string") {
      const role = candidate
        .split(/[\s,]+/)
        .map(normalizeUserRole)
        .find(Boolean);

      if (role) {
        return role;
      }
    }
  }

  return undefined;
};

export const getRoleFromJwt = (
  token: string | undefined,
): UserRole | undefined => {
  const payloadSegment = token?.split(".")[1];
  if (!payloadSegment) {
    return undefined;
  }

  const decodedPayload = decodeBase64Url(payloadSegment);
  if (!decodedPayload) {
    return undefined;
  }

  try {
    const payload = JSON.parse(decodedPayload) as Record<string, unknown>;
    return getRoleFromJwtPayload(payload);
  } catch {
    return undefined;
  }
};

export const getRoleFromAuthCookies = (
  cookies: AuthCookieReader,
): UserRole | undefined =>
  normalizeUserRole(getCookieValue(cookies, USER_ROLE_COOKIE)) ??
  getRoleFromJwt(getCookieValue(cookies, ACCESS_TOKEN_COOKIE)) ??
  getRoleFromJwt(getCookieValue(cookies, REFRESH_TOKEN_COOKIE));

export const hasAuthCookies = (cookies: AuthCookieReader): boolean =>
  cookies.has(ACCESS_TOKEN_COOKIE) || cookies.has(REFRESH_TOKEN_COOKIE);

export const isAuthRoute = (pathname: string): boolean => {
  const segments = pathname.split("/").filter(Boolean);
  const firstRouteSegment =
    segments[0] && /^[a-z]{2}$/.test(segments[0]) ? segments[1] : segments[0];

  return Boolean(
    firstRouteSegment && AUTH_ROUTE_SEGMENTS.has(firstRouteSegment),
  );
};

export const getLoginUrl = (pathname: string) =>
  buildLocalizedAppUrl("storefront", "/login", getLocaleFromPath(pathname));

export const evaluateRoleGuard = ({
  app,
  cookies,
  pathname,
}: {
  app: ProtectedApp;
  cookies: AuthCookieReader;
  pathname: string;
}): RouteGuardResult => {
  // This guard is for UX routing only; backend/API authorization remains authoritative.
  const authRoute = isAuthRoute(pathname);
  const locale = getLocaleFromPath(pathname);
  const hasSession = hasAuthCookies(cookies);

  if (!hasSession) {
    return authRoute
      ? { action: "allow" }
      : {
          action: "redirect",
          destination: getLoginUrl(pathname),
          reason: "missing-session",
        };
  }

  const role = getRoleFromAuthCookies(cookies);

  if (!role) {
    return authRoute
      ? { action: "allow" }
      : {
          action: "redirect",
          destination: getLoginUrl(pathname),
          reason: "missing-role",
        };
  }

  if (authRoute) {
    return {
      action: "redirect",
      destination: getRoleLandingUrl(role, locale),
      reason: "auth-page",
    };
  }

  const requiredRole = getRequiredRoleForApp(app);
  if (role !== requiredRole) {
    return {
      action: "redirect",
      destination: getRoleLandingUrl(role, locale),
      reason: "wrong-role",
    };
  }

  return { action: "allow" };
};
