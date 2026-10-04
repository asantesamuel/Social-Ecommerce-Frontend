import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createHandoffValues() {
  const verifier = randomBytes(32).toString("base64url");
  return {
    state: randomBytes(32).toString("base64url"),
    verifier,
    challenge: createHash("sha256").update(verifier).digest("base64url"),
  };
}

export function matchesState(expected: string, received: string): boolean {
  const left = createHash("sha256").update(expected).digest();
  const right = createHash("sha256").update(received).digest();
  return timingSafeEqual(left, right);
}
