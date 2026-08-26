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

/**
 * POST /api/auth/login/demo — Play 스토어 심사용 데모 로그인.
 * 소셜 제공자를 거치지 않는 심사 전용 경로. 자격증명이 맞으면 소셜 로그인과 동일한
 * 토큰을, 틀리면 401 을 준다. 401 은 "세션 만료"가 아니라 "잘못된 자격증명"이므로
 * 토큰 재발급 인터셉터를 타지 않게 우회한다.
 * ⚠️ 심사가 끝나면 서버 엔드포인트와 함께 제거할 것.
 */
export async function loginDemo(
  username: string,
  password: string,
): Promise<TokenResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_TOKENS;
  }
  const res = await api.post<CommonResponse<TokenResponse>>(
    "/api/auth/login/demo",
    { username, password },
    { _skipAuthRefresh: true },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  if (USE_MOCK) {
    return MOCK_TOKENS;
  }
  const res = await api.post<CommonResponse<TokenResponse>>(
    "/api/auth/refresh",
    { refresh_token: refreshToken },
    // 401 이 와도 응답 인터셉터가 재-refresh 를 시도하지 않도록 우회 플래그
    { _skipAuthRefresh: true },
  );
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

/**
 * DELETE /api/auth/me — 회원 탈퇴.
 * 서버가 사용자를 소프트 삭제(deleted_at)하고 모든 refresh token·FCM 토큰을 정리한다.
 * 탈퇴 후 같은 소셜 계정으로 다시 로그인하면 **새 유저**로 가입된다(이전 기록과 무관).
 * 응답 data 는 null. access token 인증 필요.
 */
export async function deleteAccount(): Promise<void> {
  if (USE_MOCK) return;
  await api.delete<CommonResponse<null>>("/api/auth/me");
}
