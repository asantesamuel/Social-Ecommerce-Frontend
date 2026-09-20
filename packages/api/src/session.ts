import Cookies from "js-cookie";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_ROLE_COOKIE,
} from "./cookies";
import { normalizeUserRole } from "./roles";
import type { UserRole } from "./types";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  userRole?: UserRole;
};

const getCookieOptions = (): Cookies.CookieAttributes => ({
  sameSite: "lax",
  secure:
    typeof window !== "undefined" && window.location.protocol === "https:",
});

export const getAccessToken = (): string | undefined =>
  Cookies.get(ACCESS_TOKEN_COOKIE);

export const getRefreshToken = (): string | undefined =>
  Cookies.get(REFRESH_TOKEN_COOKIE);

export const getStoredUserRole = (): UserRole | undefined =>
  normalizeUserRole(Cookies.get(USER_ROLE_COOKIE));

export const hasAuthSession = (): boolean =>
  Boolean(getAccessToken() || getRefreshToken());

export const setAuthCookies = ({
  accessToken,
  refreshToken,
  userRole,
}: AuthTokens) => {
  const options = getCookieOptions();
  Cookies.set(ACCESS_TOKEN_COOKIE, accessToken, options);
  Cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, options);

  if (userRole) {
    Cookies.set(USER_ROLE_COOKIE, userRole, options);
  } else {
    Cookies.remove(USER_ROLE_COOKIE);
  }
};

export const clearAuthCookies = () => {
  Cookies.remove(ACCESS_TOKEN_COOKIE);
  Cookies.remove(REFRESH_TOKEN_COOKIE);
  Cookies.remove(USER_ROLE_COOKIE);
};
