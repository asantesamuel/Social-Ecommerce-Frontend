import { NextRequest } from "next/server";
import {
  backendError,
  backendFetch,
  isAllowedMutation,
  noStoreJson,
  setSessionCookies,
} from "@repo/api/server";
import type { AuthResponse, RegisterPayload } from "@repo/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAllowedMutation(request)) {
    return noStoreJson({ message: "Origin is not allowed" }, 403);
  }

  let body: RegisterPayload;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Invalid registration request" }, 400);
  }
  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return noStoreJson({ message: "Invalid registration request" }, 400);
  }

  try {
    const backend = await backendFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!backend.ok) return backendError(backend);

    const session = await backend.json() as AuthResponse;
    if (!session.user || !session.accessToken || !session.refreshToken) {
      return noStoreJson({ message: "Registration response was incomplete" }, 502);
    }
    const response = noStoreJson({ user: session.user }, 201);
    setSessionCookies(response, session);
    return response;
  } catch {
    return noStoreJson({ message: "Registration service is unavailable" }, 502);
  }
}
