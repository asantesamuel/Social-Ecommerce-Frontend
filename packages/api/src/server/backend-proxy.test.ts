import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { NextRequest } from "next/server";
import { proxyBackendRequest } from "./backend-proxy";
import { POST as login } from "../../../../apps/storefront/app/api/auth/login/route";

const originalFetch = globalThis.fetch;
const originalApi = process.env.API_URL;
const originalAdmin = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL;

before(() => {
  process.env.API_URL = "https://api.example.test";
  process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL = "https://admin.example.test";
});

after(() => {
  globalThis.fetch = originalFetch;
  if (originalApi === undefined) delete process.env.API_URL;
  else process.env.API_URL = originalApi;
  if (originalAdmin === undefined) delete process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL;
  else process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL = originalAdmin;
});

function request(path: string, options: ConstructorParameters<typeof NextRequest>[1] = {}) {
  return new NextRequest(`https://store.example.test${path}`, options);
}

test("storefront login keeps tokens out of JSON and writes HttpOnly cookies", async () => {
  globalThis.fetch = async () => Response.json({
    accessToken: "access-test",
    refreshToken: "refresh-test",
    user: { id: "1", email: "admin@example.test", role: "admin" },
  });
  const response = await login(request("/api/auth/login", {
    method: "POST",
    headers: { Origin: "https://store.example.test", "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.test", password: "test-password", locale: "en" }),
  }));

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.redirectTo, "https://admin.example.test/auth/start?returnTo=%2Fen");
  assert.equal(JSON.stringify(body).includes("access-test"), false);
  assert.equal(JSON.stringify(body).includes("refresh-test"), false);
  assert.equal(response.cookies.get("ecom.access")?.httpOnly, true);
  assert.equal(response.cookies.get("ecom.refresh")?.httpOnly, true);
});

test("storefront login rejects a null JSON body", async () => {
  const response = await login(request("/api/auth/login", {
    method: "POST",
    headers: { Origin: "https://store.example.test", "Content-Type": "application/json" },
    body: "null",
  }));
  assert.equal(response.status, 400);
});

test("proxy rejects cross-origin mutations before calling the API", async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return Response.json({});
  };
  const response = await proxyBackendRequest(request("/api/backend/cart/items", {
    method: "POST",
    headers: { Origin: "https://other.example.test" },
    body: "{}",
  }), ["cart", "items"], "storefront");
  assert.equal(response.status, 403);
  assert.equal(called, false);
});

test("proxy allows public catalog reads without a session", async () => {
  globalThis.fetch = async () => Response.json({ data: [] });
  const response = await proxyBackendRequest(request("/api/backend/products"), ["products"], "storefront");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: [] });
});

test("proxy refreshes and retries exactly once after a backend 401", async () => {
  const calls: Array<{ path: string; auth: string | null }> = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const auth = new Headers(init?.headers).get("Authorization");
    calls.push({ path: url.pathname, auth });
    if (url.pathname === "/auth/refresh") {
      return Response.json({ accessToken: "new-access", refreshToken: "refresh-test" });
    }
    if (auth === "Bearer old-access") return Response.json({}, { status: 401 });
    return Response.json({ items: [] });
  };
  const response = await proxyBackendRequest(request("/api/backend/cart", {
    headers: { Cookie: "ecom.access=old-access; ecom.refresh=refresh-test" },
  }), ["cart"], "storefront");

  assert.equal(response.status, 200);
  assert.deepEqual(calls.map((call) => call.path), ["/cart", "/auth/refresh", "/cart"]);
  assert.equal(calls[2]?.auth, "Bearer new-access");
  assert.equal(response.cookies.get("ecom.access")?.value, "new-access");
});

test("proxy clears the local session after a second 401", async () => {
  let refreshes = 0;
  globalThis.fetch = async (input) => {
    if (new URL(String(input)).pathname === "/auth/refresh") {
      refreshes++;
      return Response.json({ accessToken: "new-access", refreshToken: "refresh-test" });
    }
    return Response.json({}, { status: 401 });
  };
  const response = await proxyBackendRequest(request("/api/backend/cart", {
    headers: { Cookie: "ecom.access=old-access; ecom.refresh=refresh-test" },
  }), ["cart"], "storefront");
  assert.equal(response.status, 401);
  assert.equal(refreshes, 1);
  assert.equal(response.cookies.get("ecom.access")?.maxAge, 0);
  assert.equal(response.headers.get("X-Auth-Start"), "login");
});

test("proxy rejects encoded traversal and auth endpoints", async () => {
  assert.equal((await proxyBackendRequest(request("/api/backend/x"), ["..", "users"], "storefront")).status, 400);
  assert.equal((await proxyBackendRequest(request("/api/backend/auth/login"), ["auth", "login"], "storefront")).status, 400);
});
