import { apiClient, setApiAuthorizationHeader } from "./client";
import { clearAuthCookies, getRefreshToken, setAuthCookies } from "./session";
import type { AuthResponse, LoginPayload, RegisterPayload } from "./types";

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
  setAuthCookies({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    userRole: session.user?.role,
  });
  setApiAuthorizationHeader(session.accessToken);
};

export const clearAuthSession = () => {
  clearAuthCookies();
  setApiAuthorizationHeader();
};
