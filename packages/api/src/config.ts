export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export const APP_URLS = {
  storefront: process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3001",
  adminDashboard:
    process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL ?? "http://localhost:3002",
  vendorDashboard:
    process.env.NEXT_PUBLIC_VENDOR_DASHBOARD_URL ?? "http://localhost:3003",
} as const;

export const SUPPORTED_LOCALES = ["en", "es", "fr"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en";

export const isSupportedLocale = (locale: string): locale is SupportedLocale =>
  SUPPORTED_LOCALES.some((supportedLocale) => supportedLocale === locale);

export const getLocaleFromPath = (pathname: string): SupportedLocale => {
  const match = pathname.match(/^\/([^/]+)(\/|$)/);
  const locale = match?.[1];
  return locale && isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
};

export const buildLocalizedAppUrl = (
  app: keyof typeof APP_URLS,
  pathname = "/",
  locale: string = DEFAULT_LOCALE,
): string => {
  const normalizedLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const localizedPath =
    normalizedPath === "/"
      ? `/${normalizedLocale}`
      : `/${normalizedLocale}${normalizedPath}`;

  return new URL(localizedPath, APP_URLS[app]).toString();
};
