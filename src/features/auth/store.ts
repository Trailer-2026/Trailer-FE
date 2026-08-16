import { create } from "zustand";
import { queryClient } from "@/src/api/query-client";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "./storage";

type AuthState = {
  accessToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
};

type AuthActions = {
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  clear: () => Promise<void>;
  bootstrap: () => Promise<void>;
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  isBootstrapping: true,

  setTokens: async (accessToken, refreshToken) => {
    await saveTokens(accessToken, refreshToken);
    set({ accessToken, isAuthenticated: true });
  },

  /**
   * 세션 종료 — 토큰 삭제 + 서버 응답 캐시 비우기.
   *
   * 캐시를 비우지 않으면 다른 계정으로 다시 로그인했을 때 이전 사용자의
   * 프로필·여행·알림이 잠깐 그대로 보인다(react-query 캐시는 토큰과 무관하게 남는다).
   * 캐시 삭제를 여기 두는 이유는 로그아웃 경로가 하나가 아니기 때문 —
   * 프로필의 로그아웃·탈퇴뿐 아니라 client.ts 인터셉터의 강제 로그아웃도 이걸 탄다.
   */
  clear: async () => {
    await clearTokens();
    set({ accessToken: null, isAuthenticated: false });
    queryClient.clear();
  },

  bootstrap: async () => {
    const [accessToken, refreshToken] = await Promise.all([
      getAccessToken(),
      getRefreshToken(),
    ]);
    const hasTokens = !!accessToken && !!refreshToken;
    set({
      accessToken: hasTokens ? accessToken : null,
      isAuthenticated: hasTokens,
      isBootstrapping: false,
    });
  },
}));
