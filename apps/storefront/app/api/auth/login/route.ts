import { NextRequest } from "next/server";
import {
  backendError,
  backendFetch,
  getFrontendOrigin,
  isAllowedMutation,
  noStoreJson,
  safeReturnPath,
  setSessionCookies,
} from "@repo/api/server";
import { isSupportedLocale } from "@repo/api";
import type { AuthResponse, LoginPayload } from "@repo/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAllowedMutation(request)) {
    return noStoreJson({ message: "Origin is not allowed" }, 403);
  }

  let body: LoginPayload & { returnTo?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Invalid login request" }, 400);
  }
  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return noStoreJson({ message: "Invalid login request" }, 400);
  }

  try {
    const backend = await backendFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });
    if (!backend.ok) return backendError(backend);

    const session = await backend.json() as AuthResponse;
    if (!session.user || !session.accessToken || !session.refreshToken) {
      return noStoreJson({ message: "Login response was incomplete" }, 502);
    }

    const locale = body.locale && isSupportedLocale(body.locale) ? body.locale : "en";
    const continuation = safeReturnPath(body.returnTo, "");
    const hasHandoffContinuation = continuation.startsWith("/auth/authorize?");
    let redirectTo = hasHandoffContinuation ? continuation : `/${locale}`;

    if (!hasHandoffContinuation && (session.user.role === "admin" || session.user.role === "vendor")) {
      const dashboard = session.user.role === "admin" ? "adminDashboard" : "vendorDashboard";
      const url = new URL("/auth/start", getFrontendOrigin(dashboard));
      url.searchParams.set("returnTo", `/${locale}`);
      redirectTo = url.toString();
    }

    const response = noStoreJson({ user: session.user, redirectTo });
    setSessionCookies(response, session);
    return response;
  } catch {
    return noStoreJson({ message: "Login service is unavailable" }, 502);
  }
}
