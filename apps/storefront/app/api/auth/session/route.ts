import { NextRequest } from "next/server";
import {
  applySessionResult,
  authenticatedBackendFetch,
  noStoreJson,
} from "@repo/api/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const result = await authenticatedBackendFetch(request, "/users/me");
    if (!result.response || result.unauthorized) {
      return applySessionResult(noStoreJson({ user: null }), result);
    }
    if (!result.response.ok) {
      return noStoreJson({ message: "Could not load the session" }, 502);
    }
    const user = await result.response.json();
    return applySessionResult(noStoreJson({ user }), result);
  } catch {
    return noStoreJson({ message: "Session service is unavailable" }, 502);
  }
}
