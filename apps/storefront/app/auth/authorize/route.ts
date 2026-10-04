import { NextRequest, NextResponse } from "next/server";
import {
  applySessionResult,
  authenticatedBackendFetch,
  getFrontendOrigin,
  recordHandoffEvent,
} from "@repo/api/server";

export const runtime = "nodejs";

const validState = /^[A-Za-z0-9._~-]{16,256}$/;
const validChallenge = /^[A-Za-z0-9_-]{43}$/;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const clientId = query.get("clientId");
  const state = query.get("state");
  const codeChallenge = query.get("codeChallenge");
  const method = query.get("codeChallengeMethod");
  if (
    (clientId !== "admin-dashboard" && clientId !== "vendor-dashboard") ||
    !state || !validState.test(state) ||
    !codeChallenge || !validChallenge.test(codeChallenge) || method !== "S256" ||
    [...query.keys()].some((key) => !["clientId", "state", "codeChallenge", "codeChallengeMethod"].includes(key))
  ) {
    return recordHandoffEvent(
      NextResponse.redirect(new URL("/auth/failed?reason=invalid-request", request.url)),
      "storefront", "authorize", "invalid-request", state && validState.test(state) ? state : null,
    );
  }

  const loginUrl = new URL("/en/login", getFrontendOrigin("storefront"));
  loginUrl.searchParams.set("returnTo", request.nextUrl.pathname + request.nextUrl.search);
  try {
    const result = await authenticatedBackendFetch(request, "/auth/handoff/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, state, codeChallenge, codeChallengeMethod: "S256" }),
    });
    if (!result.response || result.unauthorized) {
      return recordHandoffEvent(
        applySessionResult(NextResponse.redirect(loginUrl), result),
        "storefront", "authorize", "login-required", state,
      );
    }
    if (!result.response.ok) {
      return recordHandoffEvent(
        applySessionResult(NextResponse.redirect(new URL("/auth/failed?reason=authorization", request.url)), result),
        "storefront", "authorize", "denied", state,
      );
    }

    const body = await result.response.json() as { redirectUrl?: string };
    const callback = new URL(body.redirectUrl ?? "", request.url);
    const expectedOrigin = getFrontendOrigin(
      clientId === "admin-dashboard" ? "adminDashboard" : "vendorDashboard",
    );
    if (
      callback.origin !== expectedOrigin || callback.pathname !== "/auth/callback" ||
      callback.searchParams.get("state") !== state ||
      !callback.searchParams.get("code") ||
      [...callback.searchParams.keys()].sort().join(",") !== "code,state"
    ) {
      return recordHandoffEvent(
        NextResponse.redirect(new URL("/auth/failed?reason=authorization", request.url)),
        "storefront", "authorize", "invalid-callback", state,
      );
    }

    return recordHandoffEvent(
      applySessionResult(NextResponse.redirect(callback), result),
      "storefront", "authorize", "issued", state,
    );
  } catch {
    return recordHandoffEvent(
      NextResponse.redirect(new URL("/auth/failed?reason=service", request.url)),
      "storefront", "authorize", "service", state,
    );
  }
}
