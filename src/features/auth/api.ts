import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";
import type { TokenResponse, UserProfile } from "./types";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_AUTH === "true";

const MOCK_TOKENS: TokenResponse = {
  access_token: "mock_access_token",
  refresh_token: "mock_refresh_token",
  token_type: "Bearer",
};

export async function loginKakao(kakaoAccessToken: string): Promise<TokenResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_TOKENS;
  }
  const res = await api.post<CommonResponse<TokenResponse>>(
    "/api/auth/login/kakao",
    { access_token: kakaoAccessToken },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

export async function loginGoogle(googleIdToken: string): Promise<TokenResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_TOKENS;
  }
  const res = await api.post<CommonResponse<TokenResponse>>(
    "/api/auth/login/google",
    { id_token: googleIdToken },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  if (USE_MOCK) {
    return MOCK_TOKENS;
  }
  const res = await api.post<CommonResponse<TokenResponse>>("/api/auth/refresh", {
    refresh_token: refreshToken,
  });
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

export async function getMe(): Promise<UserProfile> {
  if (USE_MOCK) {
    return { user_idx: 1, provider: "kakao", email: "test@example.com" };
  }
  const res = await api.get<CommonResponse<UserProfile>>("/api/auth/me");
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

export async function logout(refreshToken: string): Promise<void> {
  if (USE_MOCK) return;
  await api.post("/api/auth/logout", { refresh_token: refreshToken });
}

export async function logoutAll(refreshToken: string): Promise<void> {
  if (USE_MOCK) return;
  await api.post("/api/auth/logout-all", { refresh_token: refreshToken });
}
