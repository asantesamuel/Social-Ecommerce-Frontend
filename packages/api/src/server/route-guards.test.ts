import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateRoleGuard, type AuthCookieReader } from "../route-guards";

function cookies(values: Record<string, string> = {}): AuthCookieReader {
  return {
    get: (name) => values[name] ? { value: values[name] } : undefined,
    has: (name) => Boolean(values[name]),
  };
}

test("storefront login and catalog are public, cart starts local login", () => {
  for (const path of ["/", "/en", "/en/login", "/fr/signup", "/es/products/1"]) {
    assert.deepEqual(evaluateRoleGuard({ app: "storefront", cookies: cookies(), pathname: path }), { action: "allow" });
  }
  assert.deepEqual(evaluateRoleGuard({
    app: "storefront", cookies: cookies(), pathname: "/fr/cart", search: "?item=1",
  }), {
    action: "redirect",
    destination: "/fr/login?returnTo=%2Ffr%2Fcart%3Fitem%3D1",
    reason: "missing-session",
  });
});

test("dashboard visit without its own session starts handoff locally", () => {
  assert.deepEqual(evaluateRoleGuard({
    app: "adminDashboard", cookies: cookies(), pathname: "/es/orders", search: "?page=2",
  }), {
    action: "redirect",
    destination: "/auth/start?returnTo=%2Fes%2Forders%3Fpage%3D2",
    reason: "missing-session",
  });
  assert.deepEqual(evaluateRoleGuard({ app: "vendorDashboard", cookies: cookies(), pathname: "/" }), {
    action: "redirect", destination: "/auth/start?returnTo=%2Fen", reason: "missing-session",
  });
});

test("local session permits matching role while a wrong UX role fails locally", () => {
  const admin = cookies({ "ecom.access": "opaque", "ecom.role": "admin" });
  assert.deepEqual(evaluateRoleGuard({ app: "adminDashboard", cookies: admin, pathname: "/en" }), { action: "allow" });
  assert.deepEqual(evaluateRoleGuard({ app: "vendorDashboard", cookies: admin, pathname: "/en" }), {
    action: "redirect", destination: "/auth/failed?reason=wrong-role", reason: "wrong-role",
  });
  assert.deepEqual(evaluateRoleGuard({
    app: "vendorDashboard", cookies: cookies({ "ecom.refresh": "opaque" }), pathname: "/fr",
  }), { action: "allow" });
});

test("auth and API routes stay outside the protected route guard", () => {
  for (const path of ["/auth/start", "/auth/callback", "/auth/failed", "/api/backend/cart"]) {
    assert.deepEqual(evaluateRoleGuard({ app: "adminDashboard", cookies: cookies(), pathname: path }), { action: "allow" });
  }
});
