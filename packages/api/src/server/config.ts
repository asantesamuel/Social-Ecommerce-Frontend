import "server-only";

export type HandoffClientId = "admin-dashboard" | "vendor-dashboard";

function exactUrl(value: string | undefined, name: string): URL {
  if (!value) throw new Error(`${name} is required`);

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute URL`);
  }

  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    value.includes("*") ||
    !["http:", "https:"].includes(url.protocol)
  ) {
    throw new Error(`${name} must be an exact HTTP(S) URL`);
  }

  if (url.protocol !== "https:") {
    const localhost = ["localhost", "127.0.0.1", "[::1]"].includes(
      url.hostname,
    );
    if (process.env.NODE_ENV === "production" || !localhost) {
      throw new Error(`${name} must use HTTPS`);
    }
  }

  return url;
}

export function getBackendUrl(): URL {
  const url = exactUrl(process.env.API_URL, "API_URL");
  if (url.pathname !== "/") {
    throw new Error("API_URL must be an origin without a path");
  }
  return url;
}

export function getFrontendOrigin(
  app: "storefront" | "adminDashboard" | "vendorDashboard",
): string {
  const names = {
    storefront: "NEXT_PUBLIC_STOREFRONT_URL",
    adminDashboard: "NEXT_PUBLIC_ADMIN_DASHBOARD_URL",
    vendorDashboard: "NEXT_PUBLIC_VENDOR_DASHBOARD_URL",
  } as const;
  const name = names[app];
  const url = exactUrl(process.env[name], name);
  if (url.pathname !== "/") {
    throw new Error(`${name} must be an origin without a path`);
  }
  return url.origin;
}

export function getHandoffClientConfig(expectedId: HandoffClientId) {
  const clientId = process.env.AUTH_HANDOFF_CLIENT_ID;
  const secret = process.env.AUTH_HANDOFF_CLIENT_SECRET;
  const callback = exactUrl(
    process.env.AUTH_HANDOFF_CALLBACK_URL,
    "AUTH_HANDOFF_CALLBACK_URL",
  );
  const dashboard = expectedId === "admin-dashboard"
    ? "adminDashboard"
    : "vendorDashboard";
  const origin = getFrontendOrigin(dashboard);

  if (clientId !== expectedId || !secret || Buffer.byteLength(secret) < 32) {
    throw new Error("Dashboard handoff client is not configured correctly");
  }
  if (callback.origin !== origin || callback.pathname !== "/auth/callback") {
    throw new Error("Dashboard callback does not match its registered origin");
  }

  return { clientId: expectedId, secret, callbackUrl: callback.toString() };
}
