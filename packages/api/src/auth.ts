import { apiClient, setApiAuthorizationHeader } from "./client";
import { buildLocalizedAppUrl } from "./config";
import { clearAuthCookies, getRefreshToken, setAuthCookies } from "./session";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  UserRole,
} from "./types";

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(
      "/auth/register",
      payload,
    );
    return data;
  },

  async logout(refreshToken = getRefreshToken()): Promise<void> {
    if (refreshToken) {
      await apiClient.post("/auth/logout", { refreshToken });
    }
  },
};

export const persistAuthSession = (session: AuthResponse) => {
  setAuthCookies(session);
  setApiAuthorizationHeader(session.accessToken);
};

export const clearAuthSession = () => {
  clearAuthCookies();
  setApiAuthorizationHeader();
};

export const getRoleLandingUrl = (
  role: UserRole | string | undefined,
  locale = "en",
) => {
  if (role === "admin") {
    return buildLocalizedAppUrl("adminDashboard", "/", locale);
  }

  if (role === "vendor") {
    return buildLocalizedAppUrl("vendorDashboard", "/", locale);
  }

  return buildLocalizedAppUrl("storefront", "/", locale);
};
