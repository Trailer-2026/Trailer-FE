import { isAxiosError } from "axios";

/** 인증·계정 관련 요청 실패를 사용자에게 보여줄 문자열로 정리한다. */
export function describeAuthError(err: unknown): string {
  if (isAxiosError(err)) {
    const body = err.response?.data as { message?: unknown } | undefined;
    if (body && typeof body === "object" && typeof body.message === "string") {
      return body.message; // 서버 안내 메시지 그대로
    }
    if (err.response?.status === 401) return "다시 로그인한 뒤 시도해 주세요.";
    return "요청에 실패했어요. 잠시 후 다시 시도해 주세요.";
  }
  if (err instanceof Error) return err.message;
  return "요청에 실패했어요.";
}
