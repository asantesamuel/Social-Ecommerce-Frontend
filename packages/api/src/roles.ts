import { buildLocalizedAppUrl } from "./config";
import type { UserRole } from "./types";

export type ProtectedApp = "storefront" | "adminDashboard" | "vendorDashboard";

export const USER_ROLES: readonly UserRole[] = [
  "customer",
  "vendor",
  "admin",
] as const;

export const normalizeUserRole = (value: unknown): UserRole | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/^role[_:-]/, "");
  return USER_ROLES.includes(normalized as UserRole)
    ? (normalized as UserRole)
    : undefined;
};

export const isUserRole = (value: unknown): value is UserRole =>
  Boolean(normalizeUserRole(value));

export const getRequiredRoleForApp = (app: ProtectedApp): UserRole => {
  if (app === "adminDashboard") {
    return "admin";
  }

  if (app === "vendorDashboard") {
    return "vendor";
  }

  return "customer";
};

export const getRoleLandingUrl = (
  role: UserRole | string | undefined,
  locale = "en",
) => {
  const normalizedRole = normalizeUserRole(role);

  if (normalizedRole === "admin") {
    return buildLocalizedAppUrl("adminDashboard", "/", locale);
  }

  if (normalizedRole === "vendor") {
    return buildLocalizedAppUrl("vendorDashboard", "/", locale);
  }

  return buildLocalizedAppUrl("storefront", "/", locale);
};
