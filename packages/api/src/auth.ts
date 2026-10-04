import axios from "axios";
import type {
  BrowserAuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from "./types";

export const authApi = {
  async login(payload: LoginPayload & { returnTo?: string; locale?: string }): Promise<BrowserAuthResponse> {
    const { data } = await axios.post<BrowserAuthResponse>("/api/auth/login", payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<BrowserAuthResponse> {
    const { data } = await axios.post<BrowserAuthResponse>("/api/auth/register", payload);
    return data;
  },

  async session(): Promise<{ user: User | null }> {
    const { data } = await axios.get<{ user: User | null }>("/api/auth/session");
    return data;
  },

  async logout(): Promise<void> {
    await axios.post("/api/auth/logout");
  },
};
