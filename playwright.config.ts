import { randomBytes } from "node:crypto";
import { defineConfig } from "@playwright/test";

const apiPort = 3390;
const storefront = "http://store.localhost:3311";
const admin = "http://admin.localhost:3312";
const vendor = "http://vendor.localhost:3313";
const api = `http://127.0.0.1:${apiPort}`;
const adminSecret =
  process.env.E2E_ADMIN_SECRET ?? randomBytes(32).toString("base64url");
const vendorSecret =
  process.env.E2E_VENDOR_SECRET ?? randomBytes(32).toString("base64url");
const password =
  process.env.E2E_PASSWORD ?? randomBytes(18).toString("base64url");

process.env.E2E_ADMIN_SECRET = adminSecret;
process.env.E2E_VENDOR_SECRET = vendorSecret;
process.env.E2E_STOREFRONT_URL = storefront;
process.env.E2E_ADMIN_URL = admin;
process.env.E2E_VENDOR_URL = vendor;
process.env.E2E_API_URL = api;
process.env.E2E_PASSWORD = password;

const sharedEnv = {
  API_URL: api,
  NEXT_PUBLIC_VENDOR_APPLICATIONS_SOURCE: "api",
  NEXT_PUBLIC_STOREFRONT_URL: storefront,
  NEXT_PUBLIC_ADMIN_DASHBOARD_URL: admin,
  NEXT_PUBLIC_VENDOR_DASHBOARD_URL: vendor,
  NEXT_TELEMETRY_DISABLED: "1",
};

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 30_000 },
  workers: 1,
  reporter: "list",
  use: { baseURL: storefront, channel: "chrome", headless: true },
  webServer: [
    {
      command: "npx tsx tests/fixtures/mock-api.ts",
      url: `${api}/health`,
      env: {
        E2E_API_PORT: String(apiPort),
        E2E_ADMIN_SECRET: adminSecret,
        E2E_VENDOR_SECRET: vendorSecret,
        E2E_ADMIN_CALLBACK: `${admin}/auth/callback`,
        E2E_VENDOR_CALLBACK: `${vendor}/auth/callback`,
        E2E_PASSWORD: password,
      },
      timeout: 120_000,
      reuseExistingServer: false,
    },
    {
      command: "npx next dev --webpack --port 3311 --hostname store.localhost",
      cwd: "apps/storefront",
      url: `${storefront}/en/login`,
      env: sharedEnv,
      timeout: 180_000,
      reuseExistingServer: false,
    },
    {
      command: "npx next dev --webpack --port 3312 --hostname admin.localhost",
      cwd: "apps/admin-dashboard",
      url: `${admin}/auth/failed`,
      env: {
        ...sharedEnv,
        AUTH_HANDOFF_CLIENT_ID: "admin-dashboard",
        AUTH_HANDOFF_CLIENT_SECRET: adminSecret,
        AUTH_HANDOFF_CALLBACK_URL: `${admin}/auth/callback`,
      },
      timeout: 180_000,
      reuseExistingServer: false,
    },
    {
      command: "npx next dev --webpack --port 3313 --hostname vendor.localhost",
      cwd: "apps/vendor-dashboard",
      url: `${vendor}/auth/failed`,
      env: {
        ...sharedEnv,
        AUTH_HANDOFF_CLIENT_ID: "vendor-dashboard",
        AUTH_HANDOFF_CLIENT_SECRET: vendorSecret,
        AUTH_HANDOFF_CALLBACK_URL: `${vendor}/auth/callback`,
      },
      timeout: 180_000,
      reuseExistingServer: false,
    },
  ],
});
