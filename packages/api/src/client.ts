import axios from "axios";
import { API_URL, buildLocalizedAppUrl, getLocaleFromPath } from "./config";
import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
  type AuthTokens,
} from "./session";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setApiAuthorizationHeader = (token?: string) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const redirectToSharedLogin = () => {
  if (typeof window === "undefined") {
    return;
  }

  const locale = getLocaleFromPath(window.location.pathname);
  window.location.href = buildLocalizedAppUrl("storefront", "/login", locale);
};

const isAuthRequest = (url?: string): boolean => {
  if (!url) {
    return false;
  }

  return url.startsWith("/auth/") || url.includes("/auth/");
};

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config) => {
    if (isAuthRequest(config.url)) {
      if (config.headers) {
        delete config.headers.Authorization;
      }
      return config;
    }

    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const authRequest = isAuthRequest(originalRequest?.url);

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !authRequest
    ) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = "Bearer " + token;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      const isAuthPage =
        typeof window !== "undefined" &&
        (window.location.pathname.includes("/login") ||
          window.location.pathname.includes("/signup"));

      if (!refreshToken) {
        clearAuthCookies();
        if (!isAuthPage) {
          redirectToSharedLogin();
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<AuthTokens>(
          `${API_URL}/auth/refresh`,
          {
            refreshToken,
          },
        );

        const newAccessToken = data.accessToken;

        setAuthCookies(data);

        setApiAuthorizationHeader(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthCookies();
        if (!isAuthPage) {
          redirectToSharedLogin();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
