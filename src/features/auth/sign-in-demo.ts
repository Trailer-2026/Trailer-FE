import { syncFcmToken } from "@/src/features/notification/fcm";
import { loginDemo } from "./api";
import { useAuthStore } from "./store";

export type DemoSignInError =
  | { type: "invalid_credentials" }
  | { type: "unknown"; message: string };

/**
 * Play 스토어 심사용 데모 로그인.
 * 온보딩 화면의 숨은 진입점(세 번째 슬라이드 이미지 3연타)에서만 호출된다.
 * 성공 이후 흐름(토큰 저장 → 루트 가드 리다이렉트 → FCM 동기화)은 소셜 로그인과 동일.
 * ⚠️ 심사가 끝나면 서버 엔드포인트와 함께 제거할 것.
 */
export async function signInWithDemo(
  username: string,
  password: string,
): Promise<void> {
  try {
    const tokens = await loginDemo(username, password);
    await useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token);
    // 토큰 저장 완료 후 FCM 권한 요청 + 서버 등록 (실패해도 로그인 흐름은 계속)
    void syncFcmToken();
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    // 401: 자격증명 불일치, 422: 본문 검증 실패(빈 값 등) — 둘 다 입력 오류로 안내
    if (status === 401 || status === 422) {
      throw { type: "invalid_credentials" } satisfies DemoSignInError;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw { type: "unknown", message } satisfies DemoSignInError;
  }
}
