import { isAxiosError } from "axios";

/**
 * recommend 요청 실패 원인을 화면에 보여줄 문자열로 정리한다.
 * - 타임아웃 / 네트워크 / HTTP status + 서버 메시지 순으로 구분.
 * - "추천을 불러오지 못했어요" 만 뜨면 원인을 알 수 없으니, 이걸로 디버깅한다.
 */
export function describeRecommendError(err: unknown): string {
  if (!err) return "알 수 없는 오류";

  if (isAxiosError(err)) {
    if (err.code === "ECONNABORTED") {
      return "요청이 시간 초과되었어요. 다시 시도해주세요.";
    }
    if (err.code === "ERR_NETWORK") {
      return "네트워크에 연결할 수 없어요.";
    }
    const status = err.response?.status;
    const body = err.response?.data as { message?: unknown } | string | undefined;
    const serverMsg =
      body && typeof body === "object" && typeof body.message === "string"
        ? body.message
        : typeof body === "string"
          ? body
          : null;
    if (status && serverMsg) return `${status} · ${serverMsg}`;
    if (status) return `HTTP ${status}`;
    return err.message;
  }

  if (err instanceof Error) return err.message;
  return String(err);
}
