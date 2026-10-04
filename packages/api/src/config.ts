export const APP_URLS = {
  storefront: process.env.NEXT_PUBLIC_STOREFRONT_URL,
  adminDashboard: process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL,
  vendorDashboard: process.env.NEXT_PUBLIC_VENDOR_DASHBOARD_URL,
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

  const configuredOrigin = APP_URLS[app];
  if (!configuredOrigin) {
    throw new Error(`Public origin is required for ${app}`);
  }
  const url = new URL(configuredOrigin);
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new Error(`Public origin must be an exact origin for ${app}`);
  }
  return new URL(localizedPath, url).toString();
};
