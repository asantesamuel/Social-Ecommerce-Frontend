import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { NextResponse } from "next/server";
import { clearHandoffCookies, setHandoffCookies, setSessionCookies } from "./auth-cookies";
import { getBackendUrl, getHandoffClientConfig } from "./config";
import { createHandoffValues, matchesState } from "./pkce";
import { safeReturnPath } from "./return-path";

const saved = {
  API_URL: process.env.API_URL,
  AUTH_HANDOFF_CLIENT_ID: process.env.AUTH_HANDOFF_CLIENT_ID,
  AUTH_HANDOFF_CLIENT_SECRET: process.env.AUTH_HANDOFF_CLIENT_SECRET,
  AUTH_HANDOFF_CALLBACK_URL: process.env.AUTH_HANDOFF_CALLBACK_URL,
  NEXT_PUBLIC_ADMIN_DASHBOARD_URL: process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL,
};

before(() => {
  process.env.API_URL = "https://api.example.test";
  process.env.AUTH_HANDOFF_CLIENT_ID = "admin-dashboard";
  process.env.AUTH_HANDOFF_CLIENT_SECRET = "a".repeat(32);
  process.env.AUTH_HANDOFF_CALLBACK_URL = "https://admin.example.test/auth/callback";
  process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL = "https://admin.example.test";
});

after(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("PKCE and state are independent, cryptographic and checked exactly", () => {
  const first = createHandoffValues();
  const second = createHandoffValues();
  assert.match(first.verifier, /^[A-Za-z0-9_-]{43}$/);
  assert.match(first.challenge, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(first.state, second.state);
  assert.notEqual(first.verifier, second.verifier);
  assert.equal(matchesState(first.state, first.state), true);
  assert.equal(matchesState(first.state, second.state), false);
});

test("return paths reject off-origin and encoded traversal forms", () => {
  const fallback = "/en";
  assert.equal(safeReturnPath("/en/orders?tab=open", fallback), "/en/orders?tab=open");
  for (const unsafe of [
    "https://other.example/path", "//other.example/path", "/../admin",
    "/en/%2e%2e/admin", "/en/%252e%252e/admin", "/en\\other",
    "/en/%2f%2fother.example", "/en/page#fragment",
  ]) {
    assert.equal(safeReturnPath(unsafe, fallback), fallback, unsafe);
  }
});

test("session and handoff cookies are host-local and HttpOnly", () => {
  const response = NextResponse.json({ ok: true });
  setSessionCookies(response, {
    accessToken: "access-test-value",
    refreshToken: "refresh-test-value",
    user: { id: "1", email: "a@example.test", role: "admin" },
  });
  setHandoffCookies(response, "admin", {
    state: "test-state",
    verifier: "test-verifier",
    returnTo: "/en/users",
  });
  for (const cookie of response.cookies.getAll()) {
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.sameSite, "lax");
    assert.equal(cookie.domain, undefined);
  }
  assert.equal(response.cookies.get("ecom.admin.handoff.state")?.path, "/auth");
  assert.equal(response.cookies.get("ecom.access")?.path, "/");
  clearHandoffCookies(response, "admin");
  assert.equal(response.cookies.get("ecom.admin.handoff.state")?.maxAge, 0);
});

test("server configuration requires exact registered URLs and matching clients", () => {
  assert.equal(getBackendUrl().origin, "https://api.example.test");
  assert.equal(getHandoffClientConfig("admin-dashboard").clientId, "admin-dashboard");
  process.env.AUTH_HANDOFF_CALLBACK_URL = "https://other.example.test/auth/callback";
  assert.throws(() => getHandoffClientConfig("admin-dashboard"));
  process.env.AUTH_HANDOFF_CALLBACK_URL = "https://admin.example.test/auth/callback";
});

test("separate localhost subdomains are available only outside production", () => {
  const previousEnv = process.env.NODE_ENV;
  const previousOrigin = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL;
  const previousCallback = process.env.AUTH_HANDOFF_CALLBACK_URL;
  try {
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL = "http://admin.localhost:3312";
    process.env.AUTH_HANDOFF_CALLBACK_URL = "http://admin.localhost:3312/auth/callback";
    assert.equal(getHandoffClientConfig("admin-dashboard").clientId, "admin-dashboard");
    process.env.NODE_ENV = "production";
    assert.throws(() => getHandoffClientConfig("admin-dashboard"));
  } finally {
    if (previousEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnv;
    if (previousOrigin === undefined) delete process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL;
    else process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL = previousOrigin;
    if (previousCallback === undefined) delete process.env.AUTH_HANDOFF_CALLBACK_URL;
    else process.env.AUTH_HANDOFF_CALLBACK_URL = previousCallback;
  }
});
