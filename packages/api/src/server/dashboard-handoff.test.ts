import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { NextRequest } from "next/server";
import { completeDashboardHandoff, startDashboardHandoff } from "./dashboard-handoff";

const originalFetch = globalThis.fetch;
const originalEnv = Object.fromEntries(
  [
    "API_URL",
    "NEXT_PUBLIC_STOREFRONT_URL",
    "NEXT_PUBLIC_ADMIN_DASHBOARD_URL",
    "NEXT_PUBLIC_VENDOR_DASHBOARD_URL",
    "AUTH_HANDOFF_CLIENT_ID",
    "AUTH_HANDOFF_CLIENT_SECRET",
    "AUTH_HANDOFF_CALLBACK_URL",
  ].map((key) => [key, process.env[key]]),
);

before(() => {
  process.env.API_URL = "https://api.example.test";
  process.env.NEXT_PUBLIC_STOREFRONT_URL = "https://store.example.test";
  process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL = "https://admin.example.test";
  process.env.NEXT_PUBLIC_VENDOR_DASHBOARD_URL = "https://vendor.example.test";
});

after(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function configure(app: "admin" | "vendor") {
  process.env.AUTH_HANDOFF_CLIENT_ID = `${app}-dashboard`;
  process.env.AUTH_HANDOFF_CLIENT_SECRET = "client-secret-at-least-thirty-two-bytes";
  process.env.AUTH_HANDOFF_CALLBACK_URL = `https://${app}.example.test/auth/callback`;
}

function request(app: "admin" | "vendor", path: string, cookie?: string) {
  return new NextRequest(`https://${app}.example.test${path}`, {
    headers: cookie ? { Cookie: cookie } : undefined,
  });
}

function handoffCookieHeader(response: ReturnType<typeof startDashboardHandoff>, app: "admin" | "vendor") {
  return ["state", "verifier", "returnTo"]
    .map((part) => {
      const name = `ecom.${app}.handoff.${part}`;
      return `${name}=${response.cookies.get(name)?.value}`;
    })
    .join("; ");
}

test("dashboard start stores host-local state and verifier and validates return paths", () => {
  configure("admin");
  const response = startDashboardHandoff(request("admin", "/auth/start?returnTo=%2F%2Fevil.test"), "admin");
  assert.equal(response.status, 307);
  const location = new URL(response.headers.get("location")!);
  assert.equal(location.origin, "https://store.example.test");
  assert.equal(location.pathname, "/auth/authorize");
  assert.equal(location.searchParams.get("clientId"), "admin-dashboard");
  assert.equal(location.searchParams.get("codeChallengeMethod"), "S256");
  assert.equal(location.searchParams.get("codeChallenge")?.length, 43);
  assert.equal(response.cookies.get("ecom.admin.handoff.returnTo")?.value, "/en");
  assert.equal(response.cookies.get("ecom.admin.handoff.verifier")?.httpOnly, true);
  assert.equal(response.cookies.get("ecom.admin.handoff.verifier")?.path, "/auth");
  assert.equal(location.toString().includes(response.cookies.get("ecom.admin.handoff.verifier")!.value), false);
});

test("admin callback exchanges server-side and installs only a local session", async () => {
  configure("admin");
  const start = startDashboardHandoff(request("admin", "/auth/start?returnTo=%2Fen%2Forders"), "admin");
  const state = new URL(start.headers.get("location")!).searchParams.get("state")!;
  const cookie = handoffCookieHeader(start, "admin");
  let exchangeCalls = 0;
  globalThis.fetch = async (input, init) => {
    exchangeCalls++;
    assert.equal(new URL(String(input)).pathname, "/auth/handoff/exchange");
    assert.equal(new Headers(init?.headers).get("Authorization")?.startsWith("Basic "), true);
    const body = JSON.parse(String(init?.body));
    assert.equal(body.clientId, "admin-dashboard");
    assert.equal(body.codeVerifier, start.cookies.get("ecom.admin.handoff.verifier")?.value);
    return Response.json({
      accessToken: "admin-access-test",
      refreshToken: "admin-refresh-test",
      user: { id: "1", email: "admin@example.test", role: "admin" },
    });
  };
  const callback = await completeDashboardHandoff(
    request("admin", `/auth/callback?code=${"A".repeat(43)}&state=${state}`, cookie),
    "admin",
  );
  assert.equal(exchangeCalls, 1);
  assert.equal(callback.headers.get("location"), "https://admin.example.test/en/orders");
  assert.equal(callback.cookies.get("ecom.access")?.value, "admin-access-test");
  assert.equal(callback.cookies.get("ecom.access")?.httpOnly, true);
  assert.equal(callback.cookies.get("ecom.admin.handoff.state")?.maxAge, 0);
  assert.equal(callback.headers.get("location")?.includes("admin-access-test"), false);
});

test("vendor callback uses its own client and cookies", async () => {
  configure("vendor");
  const start = startDashboardHandoff(request("vendor", "/auth/start?returnTo=%2Ffr"), "vendor");
  const state = new URL(start.headers.get("location")!).searchParams.get("state")!;
  globalThis.fetch = async () => Response.json({
    accessToken: "vendor-access-test",
    refreshToken: "vendor-refresh-test",
    user: { id: "2", email: "vendor@example.test", role: "vendor" },
  });
  const callback = await completeDashboardHandoff(
    request("vendor", `/auth/callback?code=${"B".repeat(43)}&state=${state}`, handoffCookieHeader(start, "vendor")),
    "vendor",
  );
  assert.equal(callback.headers.get("location"), "https://vendor.example.test/fr");
  assert.equal(callback.cookies.get("ecom.refresh")?.httpOnly, true);
});

test("callback rejects mismatched state and missing verifier without exchange", async () => {
  configure("admin");
  const start = startDashboardHandoff(request("admin", "/auth/start"), "admin");
  const state = new URL(start.headers.get("location")!).searchParams.get("state")!;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({});
  };
  const mismatch = await completeDashboardHandoff(
    request("admin", `/auth/callback?code=${"A".repeat(43)}&state=${"Z".repeat(43)}`, handoffCookieHeader(start, "admin")),
    "admin",
  );
  assert.equal(new URL(mismatch.headers.get("location")!).searchParams.get("reason"), "invalid-state");
  assert.equal(mismatch.cookies.get("ecom.admin.handoff.state")?.maxAge, 0);

  const missingVerifier = await completeDashboardHandoff(
    request("admin", `/auth/callback?code=${"A".repeat(43)}&state=${state}`, `ecom.admin.handoff.state=${state}`),
    "admin",
  );
  assert.equal(new URL(missingVerifier.headers.get("location")!).searchParams.get("reason"), "missing-verifier");
  assert.equal(calls, 0);
});

test("replayed or expired code, wrong role, and outage fail locally and clear transient cookies", async () => {
  configure("admin");
  const start = startDashboardHandoff(request("admin", "/auth/start"), "admin");
  const state = new URL(start.headers.get("location")!).searchParams.get("state")!;
  const callbackRequest = request("admin", `/auth/callback?code=${"A".repeat(43)}&state=${state}`, handoffCookieHeader(start, "admin"));
  globalThis.fetch = async () => Response.json({}, { status: 401 });
  const used = await completeDashboardHandoff(callbackRequest, "admin");
  assert.equal(new URL(used.headers.get("location")!).searchParams.get("reason"), "expired-or-used");
  assert.equal(used.cookies.get("ecom.admin.handoff.verifier")?.maxAge, 0);

  globalThis.fetch = async () => Response.json({
    accessToken: "wrong-access",
    refreshToken: "wrong-refresh",
    user: { id: "3", email: "wrong@example.test", role: "vendor" },
  });
  const wrongRole = await completeDashboardHandoff(callbackRequest, "admin");
  assert.equal(new URL(wrongRole.headers.get("location")!).searchParams.get("reason"), "wrong-role");
  assert.equal(wrongRole.cookies.get("ecom.access"), undefined);

  globalThis.fetch = async () => { throw new Error("backend offline"); };
  const offline = await completeDashboardHandoff(callbackRequest, "admin");
  assert.equal(new URL(offline.headers.get("location")!).searchParams.get("reason"), "service");
  assert.equal(offline.cookies.get("ecom.admin.handoff.state")?.maxAge, 0);
});

test("wrong client configuration fails before issuing a handoff", () => {
  configure("admin");
  process.env.AUTH_HANDOFF_CLIENT_ID = "vendor-dashboard";
  const response = startDashboardHandoff(request("admin", "/auth/start"), "admin");
  assert.equal(new URL(response.headers.get("location")!).searchParams.get("reason"), "configuration");
  assert.equal(response.cookies.get("ecom.admin.handoff.state")?.maxAge, 0);
});
