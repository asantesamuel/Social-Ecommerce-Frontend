import "server-only";
import { getBackendUrl } from "./config";

export function backendUrl(path: string): URL {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    throw new Error("Invalid backend path");
  }
  const base = getBackendUrl();
  const url = new URL(path, base);
  if (url.origin !== base.origin) throw new Error("Invalid backend origin");
  return url;
}

export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(backendUrl(path), {
    ...init,
    cache: "no-store",
    redirect: "manual",
  });
}
