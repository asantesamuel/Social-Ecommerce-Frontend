import "server-only";
import { NextRequest, NextResponse } from "next/server";
import {
  clearHandoffCookies,
  getHandoffCookieValues,
  setHandoffCookies,
  setSessionCookies,
  type HandoffApp,
} from "./auth-cookies";
import { getFrontendOrigin, getHandoffClientConfig } from "./config";
import { exchangeHandoff } from "./handoff";
import { createHandoffValues, matchesState } from "./pkce";
import { safeReturnPath } from "./return-path";

const codePattern = /^[A-Za-z0-9_-]{43}$/;
const statePattern = /^[A-Za-z0-9._~-]{16,256}$/;
const verifierPattern = /^[A-Za-z0-9._~-]{43,128}$/;

function dashboardReturnPath(value: string | null | undefined): string {
  const path = safeReturnPath(value, "/en");
  return /^\/(en|es|fr)(?:[/?]|$)/.test(path) ? path : "/en";
}

function failure(request: NextRequest, app: HandoffApp, reason: string): NextResponse {
  const url = new URL("/auth/failed", request.url);
  url.searchParams.set("reason", reason);
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  clearHandoffCookies(response, app);
  return response;
}

export function startDashboardHandoff(request: NextRequest, app: HandoffApp): NextResponse {
  const clientId = app === "admin" ? "admin-dashboard" : "vendor-dashboard";
  try {
    getHandoffClientConfig(clientId);
    const dashboardOrigin = getFrontendOrigin(app === "admin" ? "adminDashboard" : "vendorDashboard");
    if (request.nextUrl.origin !== dashboardOrigin) {
      return failure(request, app, "configuration");
    }

    const values = createHandoffValues();
    const returnTo = dashboardReturnPath(request.nextUrl.searchParams.get("returnTo"));
    const authorizeUrl = new URL("/auth/authorize", getFrontendOrigin("storefront"));
    authorizeUrl.searchParams.set("clientId", clientId);
    authorizeUrl.searchParams.set("state", values.state);
    authorizeUrl.searchParams.set("codeChallenge", values.challenge);
    authorizeUrl.searchParams.set("codeChallengeMethod", "S256");

    const response = NextResponse.redirect(authorizeUrl);
    response.headers.set("Cache-Control", "no-store");
    setHandoffCookies(response, app, { ...values, returnTo });
    return response;
  } catch {
    return failure(request, app, "configuration");
  }
}

export async function completeDashboardHandoff(
  request: NextRequest,
  app: HandoffApp,
): Promise<NextResponse> {
  const clientId = app === "admin" ? "admin-dashboard" : "vendor-dashboard";
  const values = getHandoffCookieValues(request, app);
  const query = request.nextUrl.searchParams;
  const code = query.get("code");
  const state = query.get("state");

  if (!values.state || !state || !statePattern.test(state) || !matchesState(values.state, state)) {
    return failure(request, app, "invalid-state");
  }
  if (!values.verifier || !verifierPattern.test(values.verifier)) {
    return failure(request, app, "missing-verifier");
  }
  if (!code || !codePattern.test(code) || [...query.keys()].some((key) => key !== "code" && key !== "state")) {
    return failure(request, app, "invalid-code");
  }

  try {
    const config = getHandoffClientConfig(clientId);
    const dashboardOrigin = getFrontendOrigin(app === "admin" ? "adminDashboard" : "vendorDashboard");
    if (request.nextUrl.origin !== dashboardOrigin) {
      return failure(request, app, "configuration");
    }

    const { response: backend, session } = await exchangeHandoff(
      config.clientId,
      config.secret,
      code,
      values.verifier,
    );
    if (backend.status === 401) return failure(request, app, "expired-or-used");
    if (backend.status === 403) return failure(request, app, "wrong-role");
    if (backend.status === 429) return failure(request, app, "rate-limited");
    if (!backend.ok || !session) return failure(request, app, "service");
    if (
      !session.accessToken || !session.refreshToken || !session.user ||
      session.user.role !== app
    ) {
      return failure(request, app, "wrong-role");
    }

    const response = NextResponse.redirect(new URL(dashboardReturnPath(values.returnTo), dashboardOrigin));
    response.headers.set("Cache-Control", "no-store");
    clearHandoffCookies(response, app);
    setSessionCookies(response, session);
    return response;
  } catch {
    return failure(request, app, "service");
  }
}
