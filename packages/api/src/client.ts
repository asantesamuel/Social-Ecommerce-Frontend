import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const getLocaleFromPath = (pathname: string): string => {
  const match = pathname.match(/^\/(en|es|fr)(\/|$)/);
  return match?.[1] ?? 'en';
};

const redirectToSharedLogin = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const locale = getLocaleFromPath(window.location.pathname);
  window.location.href = `http://localhost:3001/${locale}/login`;
};

const isAuthRequest = (url?: string): boolean => {
  if (!url) {
    return false;
  }

  return url.startsWith('/auth/') || url.includes('/auth/');
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

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (isAuthRequest(config.url)) {
      if (config.headers) {
        delete config.headers.Authorization;
      }
      return config;
    }

    const token = Cookies.get('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const authRequest = isAuthRequest(originalRequest?.url);

    if (error.response?.status === 401 && !originalRequest._retry && !authRequest) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = 'Bearer ' + token;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get('refreshToken');
      const isAuthPage = typeof window !== 'undefined' && (window.location.pathname.includes('/login') || window.location.pathname.includes('/signup'));

      if (!refreshToken) {
        // Handle logout
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        if (!isAuthPage) {
            redirectToSharedLogin();
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        Cookies.set('accessToken', newAccessToken, { secure: window.location.protocol === 'https:', sameSite: 'lax' });
        Cookies.set('refreshToken', newRefreshToken, { secure: window.location.protocol === 'https:', sameSite: 'lax' });

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        if (!isAuthPage) {
            redirectToSharedLogin();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
