import { createHash, randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

type Role = "customer" | "admin" | "vendor";
type Identity = { id: string; email: string; role: Role };
type Grant = { identity: Identity; clientId: string; challenge: string };

const access = new Map<string, Identity>();
const refresh = new Map<string, Identity>();
const grants = new Map<string, Grant>();
let refreshCount = 0;

const clients = {
  "admin-dashboard": {
    role: "admin",
    secret: process.env.E2E_ADMIN_SECRET,
    callback: process.env.E2E_ADMIN_CALLBACK,
  },
  "vendor-dashboard": {
    role: "vendor",
    secret: process.env.E2E_VENDOR_SECRET,
    callback: process.env.E2E_VENDOR_CALLBACK,
  },
} as const;

function json(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

async function readBody(request: IncomingMessage): Promise<Record<string, string>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as Record<string, string>;
}

function issue(identity: Identity) {
  const accessToken = randomBytes(24).toString("base64url");
  const refreshToken = randomBytes(24).toString("base64url");
  access.set(accessToken, identity);
  refresh.set(refreshToken, identity);
  return { accessToken, refreshToken, user: identity };
}

function bearerIdentity(request: IncomingMessage): Identity | undefined {
  const token = request.headers.authorization?.replace(/^Bearer /, "");
  return token ? access.get(token) : undefined;
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://mock.localhost");
    const path = url.pathname;
    if (path === "/health") return json(response, 200, { ok: true });
    if (path === "/__metrics") return json(response, 200, { refreshCount });

    if (path === "/auth/login" && request.method === "POST") {
      const body = await readBody(request);
      if (body.password !== process.env.E2E_PASSWORD) {
        return json(response, 401, { message: "Invalid credentials" });
      }
      const role = body.email?.split("@")[0];
      if (role !== "admin" && role !== "vendor" && role !== "customer") {
        return json(response, 401, { message: "Invalid credentials" });
      }
      return json(response, 200, issue({ id: role, email: body.email, role }));
    }

    if (path === "/auth/refresh" && request.method === "POST") {
      refreshCount++;
      const body = await readBody(request);
      const identity = refresh.get(body.refreshToken);
      if (!identity) return json(response, 401, { message: "Expired session" });
      const accessToken = randomBytes(24).toString("base64url");
      access.set(accessToken, identity);
      return json(response, 200, { accessToken, refreshToken: body.refreshToken, user: identity });
    }

    if (path === "/auth/logout" && request.method === "POST") {
      const body = await readBody(request);
      refresh.delete(body.refreshToken);
      response.writeHead(204);
      return response.end();
    }

    if (path === "/auth/handoff/authorize" && request.method === "POST") {
      const identity = bearerIdentity(request);
      if (!identity) return json(response, 401, { message: "Unauthorized" });
      const body = await readBody(request);
      const client = clients[body.clientId as keyof typeof clients];
      if (!client) return json(response, 400, { message: "Invalid client" });
      if (identity.role !== client.role) return json(response, 403, { message: "Wrong role" });
      const code = randomBytes(32).toString("base64url");
      grants.set(code, { identity, clientId: body.clientId, challenge: body.codeChallenge });
      const callback = new URL(client.callback!);
      callback.searchParams.set("code", code);
      callback.searchParams.set("state", body.state);
      return json(response, 200, { redirectUrl: callback.toString(), expiresIn: 60 });
    }

    if (path === "/auth/handoff/exchange" && request.method === "POST") {
      const body = await readBody(request);
      const client = clients[body.clientId as keyof typeof clients];
      const credentials = request.headers.authorization?.startsWith("Basic ")
        ? Buffer.from(request.headers.authorization.slice(6), "base64").toString("utf8")
        : "";
      const grant = grants.get(body.code);
      grants.delete(body.code);
      const challenge = createHash("sha256").update(body.codeVerifier ?? "").digest("base64url");
      if (!client || !grant || credentials !== `${body.clientId}:${client.secret}` ||
        grant.clientId !== body.clientId || grant.challenge !== challenge) {
        return json(response, 401, { message: "Invalid handoff" });
      }
      return json(response, 200, issue(grant.identity));
    }

    if (path === "/products" && request.method === "GET") {
      return json(response, 200, { data: [], page: 1, totalPages: 1 });
    }
    if (path === "/categories" && request.method === "GET") return json(response, 200, []);
    if (path === "/always-unauthorized") return json(response, 401, { message: "Unauthorized" });

    const identity = bearerIdentity(request);
    if (!identity) return json(response, 401, { message: "Unauthorized" });
    if (path === "/users/me") return json(response, 200, identity);
    if (path === "/cart") return json(response, 200, { items: [], subtotal: 0 });
    if (path === "/vendors/me" && identity.role === "vendor") {
      return json(response, 200, { id: "vendor-1", businessName: "Test Vendor", status: "approved" });
    }
    if (path === "/admin/orders" && identity.role === "admin") {
      return json(response, 200, { data: [], page: 1, totalPages: 1 });
    }
    return json(response, 404, { message: "Not found" });
  } catch {
    return json(response, 500, { message: "Mock request failed" });
  }
});

server.listen(Number(process.env.E2E_API_PORT), "127.0.0.1");
