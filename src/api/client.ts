import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "@/src/features/auth/storage";
// refreshTokens 는 require cycle(client ↔ api) 방지를 위해 인터셉터 내부에서 동적 import 한다.

declare module "axios" {
  export interface AxiosRequestConfig {
    /** true 면 401 응답에도 토큰 재발급 인터셉터를 타지 않는다 (refresh 요청 전용). */
    _skipAuthRefresh?: boolean;
  }
}

// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
type FailedRequest = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};
let failedQueue: FailedRequest[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _skipAuthRefresh?: boolean;
    };

    // refresh 요청 자체가 401 이면 인터셉터를 타면 안 된다.
    // (타면 자기 자신을 failedQueue 에 넣고 영원히 대기 → 앱 전체 데드락)
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest._skipAuthRefresh
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest._retry = true;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error("no refresh token");

      const { refreshTokens } = await import("@/src/features/auth/api");
      const tokens = await refreshTokens(refreshToken);
      await saveTokens(tokens.access_token, tokens.refresh_token);

      api.defaults.headers.common["Authorization"] = `Bearer ${tokens.access_token}`;
      originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;

      processQueue(null, tokens.access_token);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearTokens();
      // 로그인 화면으로 리다이렉트는 store.clear()를 통해 가드가 처리
      const { useAuthStore } = await import("@/src/features/auth/store");
      useAuthStore.getState().clear();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// 연결 테스트용
export const getExampleList = async () => {
  const res = await api.get("/api/example");
  return res.data;
};
