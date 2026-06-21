import { create } from "zustand";
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

  clear: async () => {
    await clearTokens();
    set({ accessToken: null, isAuthenticated: false });
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
