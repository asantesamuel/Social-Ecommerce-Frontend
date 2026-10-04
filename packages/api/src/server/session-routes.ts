import "server-only";
import { NextRequest } from "next/server";
import { clearSessionCookies, getSessionTokens } from "./auth-cookies";
import { backendFetch } from "./backend";
import { isAllowedMutation, noStoreJson } from "./backend-proxy";

export async function logoutSession(request: NextRequest) {
  if (!isAllowedMutation(request)) {
    return noStoreJson({ message: "Origin is not allowed" }, 403);
  }

  const { refreshToken } = getSessionTokens(request);
  if (refreshToken) {
    try {
      await backendFetch("/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Local logout still removes the browser's session if the API is unavailable.
    }
  }
  const response = noStoreJson({ success: true });
  clearSessionCookies(response);
  return response;
}
