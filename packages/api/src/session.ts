import Cookies from "js-cookie";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

const getCookieOptions = (): Cookies.CookieAttributes => ({
  sameSite: "lax",
  secure:
    typeof window !== "undefined" && window.location.protocol === "https:",
});

export const getAccessToken = (): string | undefined =>
  Cookies.get(ACCESS_TOKEN_COOKIE);

export const getRefreshToken = (): string | undefined =>
  Cookies.get(REFRESH_TOKEN_COOKIE);

export const hasAuthSession = (): boolean =>
  Boolean(getAccessToken() || getRefreshToken());

export const setAuthCookies = ({ accessToken, refreshToken }: AuthTokens) => {
  const options = getCookieOptions();
  Cookies.set(ACCESS_TOKEN_COOKIE, accessToken, options);
  Cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, options);
};

export const clearAuthCookies = () => {
  Cookies.remove(ACCESS_TOKEN_COOKIE);
  Cookies.remove(REFRESH_TOKEN_COOKIE);
};
