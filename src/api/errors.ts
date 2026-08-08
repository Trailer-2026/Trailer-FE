import { isAxiosError } from "axios";

/**
 * API 실패를 사용자에게 보여줄 문자열로 정리한다(전 기능 공통).
 *
 * 서버 본문이 JSON 이 아닐 때(nginx 504 HTML 등) 본문을 그대로 노출하면
 * 화면에 `<html><title>504 Gateway Time-out</title>...` 이 통째로 찍힌다.
 * 따라서 message 필드가 있는 JSON 일 때만 서버 문구를 쓰고, 나머지는 status 로 요약한다.
 */
export function describeApiError(err: unknown): string {
  if (!err) return "알 수 없는 오류가 발생했어요.";

  if (isAxiosError(err)) {
    if (err.code === "ECONNABORTED") {
      return "요청이 시간 초과되었어요. 다시 시도해주세요.";
    }
    if (err.code === "ERR_NETWORK") {
      return "네트워크에 연결할 수 없어요.";
    }

    const status = err.response?.status;

    // 게이트웨이 계열은 백엔드가 늦거나 죽은 것 — 사용자가 할 수 있는 건 재시도뿐.
    if (status === 502 || status === 503 || status === 504) {
      return `서버가 응답하지 않아요. 잠시 후 다시 시도해주세요. (HTTP ${status})`;
    }

    const body = err.response?.data as { message?: unknown } | undefined;
    if (body && typeof body === "object" && typeof body.message === "string") {
      return status ? `${status} · ${body.message}` : body.message;
    }

    if (status) return `요청에 실패했어요 (HTTP ${status})`;
    return err.message;
  }

  if (err instanceof Error) return err.message;
  return String(err);
}
