import { isAxiosError } from "axios";

/**
 * 렌더 시작(POST) 실패를 사용자에게 보여줄 문자열로 정리한다.
 * 400 은 서버 message(사진 2장 미만 / GPS 부족 / 같은 장소 / 알 수 없는 옵션 등)를
 * 그대로 노출한다. 타임아웃·네트워크는 별도 안내.
 */
export function describeRenderError(err: unknown): string {
  if (isAxiosError(err)) {
    if (err.code === "ECONNABORTED") {
      return "요청이 시간 초과되었어요. 다시 시도해주세요.";
    }
    if (err.code === "ERR_NETWORK") {
      return "네트워크에 연결할 수 없어요.";
    }
    const body = err.response?.data as { message?: unknown } | undefined;
    if (body && typeof body === "object" && typeof body.message === "string") {
      return body.message; // 서버 안내 메시지 그대로
    }
    const status = err.response?.status;
    if (status) return `요청에 실패했어요 (HTTP ${status})`;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "알 수 없는 오류가 발생했어요.";
}
