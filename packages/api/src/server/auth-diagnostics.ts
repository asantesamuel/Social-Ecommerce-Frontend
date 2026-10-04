import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export function recordHandoffEvent(
  response: NextResponse,
  app: "storefront" | "admin" | "vendor",
  stage: "start" | "authorize" | "callback",
  reason: string,
  state?: string | null,
): NextResponse {
  const correlationId = state
    ? createHash("sha256").update(state).digest("hex").slice(0, 16)
    : randomUUID();
  console.info(JSON.stringify({ event: "auth_handoff", app, stage, reason, correlationId }));
  response.headers.set("X-Auth-Correlation-Id", correlationId);
  return response;
}
