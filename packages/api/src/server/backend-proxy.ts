import "server-only";
import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookies,
  getSessionTokens,
  updateAccessCookie,
  updateRefreshCookie,
} from "./auth-cookies";
import { backendFetch } from "./backend";

type AppKind = "storefront" | "admin" | "vendor";
type RefreshedSession = { accessToken: string; refreshToken?: string };

export function isAllowedMutation(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin === request.nextUrl.origin;
    } catch {
      return false;
    }
  }
  return request.headers.get("sec-fetch-site") === "same-origin";
}

export function noStoreJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function backendError(response: Response): Promise<NextResponse> {
  const status = response.status >= 400 && response.status < 600 ? response.status : 502;
  let message = "Request failed. Please try again.";
  try {
    const body = await response.json() as { message?: unknown };
    if (typeof body.message === "string" && body.message.length <= 250) {
      message = body.message;
    }
  } catch {
    // Do not pass unstructured backend responses to browser code.
  }
  return noStoreJson({ message }, status);
}

async function refreshSession(refreshToken: string): Promise<RefreshedSession | null> {
  try {
    const response = await backendFetch("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return null;
    const session = await response.json() as RefreshedSession;
    return typeof session.accessToken === "string" && session.accessToken
      ? session
      : null;
  } catch {
    return null;
  }
}

export async function authenticatedBackendFetch(
  request: NextRequest,
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response | null; refreshed?: RefreshedSession; unauthorized: boolean }> {
  const tokens = getSessionTokens(request);
  let accessToken = tokens.accessToken;
  let refreshed: RefreshedSession | undefined;

  if (!accessToken && tokens.refreshToken) {
    refreshed = (await refreshSession(tokens.refreshToken)) ?? undefined;
    accessToken = refreshed?.accessToken;
  }
  if (!accessToken) return { response: null, unauthorized: true };

  const send = (token: string) => backendFetch(path, {
    ...init,
    headers: { ...Object.fromEntries(new Headers(init.headers)), Authorization: `Bearer ${token}` },
  });

  let response = await send(accessToken);
  if (response.status === 401 && tokens.refreshToken && !refreshed) {
    refreshed = (await refreshSession(tokens.refreshToken)) ?? undefined;
    if (refreshed) response = await send(refreshed.accessToken);
  }

  return { response, refreshed, unauthorized: response.status === 401 };
}

export function applySessionResult(
  response: NextResponse,
  result: { refreshed?: RefreshedSession; unauthorized: boolean },
) {
  if (result.unauthorized) {
    clearSessionCookies(response);
  } else if (result.refreshed) {
    updateAccessCookie(response, result.refreshed.accessToken);
    if (result.refreshed.refreshToken) {
      updateRefreshCookie(response, result.refreshed.refreshToken);
    }
  }
  return response;
}

function validatedBackendPath(segments: string[], search: string): string | null {
  if (!segments.length || segments.length > 20) return null;
  if (segments.some((segment) =>
    !segment || segment === "." || segment === ".." ||
    /[\\/:?#\x00-\x1f]/.test(segment) || /%(?:2e|2f|5c|25)/i.test(segment)
  )) return null;
  if (segments[0] === "auth") return null;
  return `/${segments.map(encodeURIComponent).join("/")}${search}`;
}

export async function proxyBackendRequest(
  request: NextRequest,
  segments: string[],
  app: AppKind,
): Promise<NextResponse> {
  const path = validatedBackendPath(segments, request.nextUrl.search);
  if (!path) return noStoreJson({ message: "Invalid API path" }, 400);
  if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    return noStoreJson({ message: "Method not allowed" }, 405);
  }
  if (request.method !== "GET" && !isAllowedMutation(request)) {
    return noStoreJson({ message: "Origin is not allowed" }, 403);
  }

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("Accept", accept);

  try {
    const init = {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : Buffer.from(await request.arrayBuffer()),
    };
    const publicCatalog = app === "storefront" && request.method === "GET" &&
      (segments[0] === "products" || segments[0] === "categories");
    const result = publicCatalog
      ? { response: await backendFetch(path, init), unauthorized: false }
      : await authenticatedBackendFetch(request, path, init);
    if (!result.response) return authRequired(app);

    const outgoingHeaders = new Headers({ "Cache-Control": "no-store" });
    for (const name of ["content-type", "content-disposition"]) {
      const value = result.response.headers.get(name);
      if (value) outgoingHeaders.set(name, value);
    }
    if (result.unauthorized) {
      outgoingHeaders.set("X-Auth-Start", app === "storefront" ? "login" : "handoff");
    }

    const response = new NextResponse(
      result.response.status === 204 ? null : await result.response.arrayBuffer(),
      { status: result.response.status, headers: outgoingHeaders },
    );
    return applySessionResult(response, result);
  } catch {
    return noStoreJson({ message: "The API is unavailable. Please try again." }, 502);
  }
}

function authRequired(app: AppKind): NextResponse {
  const response = noStoreJson({ message: "Authentication required" }, 401);
  response.headers.set("X-Auth-Start", app === "storefront" ? "login" : "handoff");
  clearSessionCookies(response);
  return response;
}
