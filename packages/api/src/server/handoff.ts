import "server-only";
import { backendFetch } from "./backend";
import type { AuthResponse } from "../types";
import type { HandoffClientId } from "./config";

export type HandoffAuthorizeBody = {
  clientId: HandoffClientId;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
};

export async function authorizeHandoff(accessToken: string, body: HandoffAuthorizeBody) {
  return backendFetch("/auth/handoff/authorize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
}

export async function exchangeHandoff(
  clientId: HandoffClientId,
  secret: string,
  code: string,
  codeVerifier: string,
): Promise<{ response: Response; session?: AuthResponse }> {
  const response = await backendFetch("/auth/handoff/exchange", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    },
    body: JSON.stringify({ clientId, code, codeVerifier }),
  });
  return { response, session: response.ok ? await response.json() as AuthResponse : undefined };
}
