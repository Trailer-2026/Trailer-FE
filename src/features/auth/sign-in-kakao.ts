import { login } from "@react-native-kakao/user";
import { loginKakao } from "./api";
import { useAuthStore } from "./store";

export type KakaoSignInError =
  | { type: "cancelled" }
  | { type: "invalid_token" }
  | { type: "unknown"; message: string };

export async function signInWithKakao(): Promise<void> {
  let kakaoToken: string;

  try {
    const result = await login();
    kakaoToken = result.accessToken;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // 카카오 SDK가 사용자 취소 시 던지는 에러 코드
    if (message.includes("CANCELED") || message.includes("cancelled")) {
      throw { type: "cancelled" } satisfies KakaoSignInError;
    }
    throw { type: "unknown", message } satisfies KakaoSignInError;
  }

  try {
    const tokens = await loginKakao(kakaoToken);
    await useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token);
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 400) {
      throw { type: "invalid_token" } satisfies KakaoSignInError;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw { type: "unknown", message } satisfies KakaoSignInError;
  }
}
