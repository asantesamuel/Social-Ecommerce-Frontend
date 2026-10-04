import axios from "axios";
import { getLocaleFromPath } from "./config";

export const apiClient = axios.create({
  baseURL: "/api/backend",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const start = error.response.headers?.["x-auth-start"];
      const path = window.location.pathname;
      if (start === "handoff" && !path.startsWith("/auth/")) {
        window.location.assign(`/auth/start?returnTo=${encodeURIComponent(path + window.location.search)}`);
      } else if (start === "login" && !/\/(login|signup)(\/|$)/.test(path)) {
        const locale = getLocaleFromPath(path);
        window.location.assign(`/${locale}/login?returnTo=${encodeURIComponent(path + window.location.search)}`);
      }
    }
    return Promise.reject(error);
  },
);
