import { isAxiosError } from "axios";

/**
 * 일정 추가/편집/삭제 실패를 사용자에게 보여줄 문자열로 정리한다.
 * 400(필수값 누락 / 기간 벗어남 / 도착일<출발일 / 출발역 좌표 없음 등)은
 * 서버 message 를 그대로 노출한다.
 */
export function describeScheduleError(err: unknown): string {
  if (isAxiosError(err)) {
    const body = err.response?.data as { message?: unknown } | undefined;
    if (body && typeof body === "object" && typeof body.message === "string") {
      return body.message; // 서버 안내 메시지 그대로
    }
    const status = err.response?.status;
    if (status === 401) return "로그인이 필요해요.";
    if (status === 404) return "여행을 찾을 수 없어요.";
    return "요청에 실패했어요. 잠시 후 다시 시도해 주세요.";
  }
  if (err instanceof Error) return err.message;
  return "요청에 실패했어요.";
}

/** 장소 검색 실패(주로 502 카카오 호출 실패) 안내. */
export function describePlaceSearchError(): string {
  return "장소 검색에 실패했어요. 잠시 후 다시 시도해 주세요.";
}
