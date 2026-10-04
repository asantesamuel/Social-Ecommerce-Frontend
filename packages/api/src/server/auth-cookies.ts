import "server-only";
import { NextRequest, NextResponse } from "next/server";
import type { AuthResponse, UserRole } from "../types";

export const SESSION_COOKIES = {
  access: "ecom.access",
  refresh: "ecom.refresh",
  role: "ecom.role",
} as const;

export const LEGACY_COOKIES = ["accessToken", "refreshToken", "userRole"] as const;

export type HandoffApp = "admin" | "vendor";

export function handoffCookies(app: HandoffApp) {
  return {
    state: `ecom.${app}.handoff.state`,
    verifier: `ecom.${app}.handoff.verifier`,
    returnTo: `ecom.${app}.handoff.returnTo`,
  } as const;
}

function cookieOptions(maxAge: number, path = "/") {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path,
    maxAge,
  };
}

export function getSessionTokens(request: NextRequest) {
  return {
    accessToken: request.cookies.get(SESSION_COOKIES.access)?.value,
    refreshToken: request.cookies.get(SESSION_COOKIES.refresh)?.value,
  };
}

export function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.has(SESSION_COOKIES.access) ||
    request.cookies.has(SESSION_COOKIES.refresh),
  );
}

export function setSessionCookies(response: NextResponse, session: AuthResponse) {
  response.cookies.set(SESSION_COOKIES.access, session.accessToken, cookieOptions(15 * 60));
  response.cookies.set(SESSION_COOKIES.refresh, session.refreshToken, cookieOptions(7 * 24 * 60 * 60));
  if (session.user?.role) {
    response.cookies.set(SESSION_COOKIES.role, session.user.role, cookieOptions(7 * 24 * 60 * 60));
  }
  clearLegacyCookies(response);
}

export function updateAccessCookie(response: NextResponse, accessToken: string) {
  response.cookies.set(SESSION_COOKIES.access, accessToken, cookieOptions(15 * 60));
}

export function clearLegacyCookies(response: NextResponse) {
  for (const name of LEGACY_COOKIES) {
    response.cookies.set(name, "", { ...cookieOptions(0), maxAge: 0 });
  }
}

export function clearSessionCookies(response: NextResponse) {
  for (const name of Object.values(SESSION_COOKIES)) {
    response.cookies.set(name, "", { ...cookieOptions(0), maxAge: 0 });
  }
  clearLegacyCookies(response);
}

export function setHandoffCookies(
  response: NextResponse,
  app: HandoffApp,
  values: { state: string; verifier: string; returnTo: string },
) {
  const names = handoffCookies(app);
  for (const key of Object.keys(names) as Array<keyof typeof names>) {
    response.cookies.set(names[key], values[key], cookieOptions(5 * 60, "/auth"));
  }
}

export function clearHandoffCookies(response: NextResponse, app: HandoffApp) {
  for (const name of Object.values(handoffCookies(app))) {
    response.cookies.set(name, "", { ...cookieOptions(0, "/auth"), maxAge: 0 });
  }
}

export function getHandoffCookieValues(request: NextRequest, app: HandoffApp) {
  const names = handoffCookies(app);
  return {
    state: request.cookies.get(names.state)?.value,
    verifier: request.cookies.get(names.verifier)?.value,
    returnTo: request.cookies.get(names.returnTo)?.value,
  };
}

export function getSessionRole(request: NextRequest): UserRole | undefined {
  const role = request.cookies.get(SESSION_COOKIES.role)?.value;
  return role === "admin" || role === "vendor" || role === "customer"
    ? role
    : undefined;
}
