import { isAxiosError } from "axios";

const FALLBACK = "창밖 풍경 시각표를 불러오지 못했어요.";

/** 풍경 시각표 조회 실패를 화면에 보여줄 문자열로 정리한다. */
export function describeScenicError(err: unknown): string {
  if (isAxiosError(err)) {
    const body = err.response?.data as { message?: unknown } | undefined;
    if (body && typeof body === "object" && typeof body.message === "string") {
      return body.message;
    }
    if (err.response?.status === 401) return "로그인이 필요해요.";
    return FALLBACK;
  }
  if (err instanceof Error) return err.message;
  return FALLBACK;
}
