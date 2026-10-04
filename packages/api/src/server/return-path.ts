import "server-only";

export function safeReturnPath(value: string | null | undefined, fallback: string): string {
  if (!value || value.length > 2048 || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  if (/[\\#\x00-\x1f\x7f]/.test(value) || /%(?:2e|2f|5c|25)/i.test(value)) {
    return fallback;
  }

  const path = value.split("?", 1)[0] ?? "";
  if (path.split("/").some((segment) => segment === "." || segment === "..")) {
    return fallback;
  }

  try {
    const url = new URL(value, "https://local.invalid");
    if (url.origin !== "https://local.invalid" || url.pathname !== path) {
      return fallback;
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}
