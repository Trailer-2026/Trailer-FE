import { isAxiosError } from "axios";

/** 풍경 조회 실패를 화면에 보여줄 문자열로 정리한다. */
export function describeScenicError(err: unknown): string {
  if (isAxiosError(err)) {
    const body = err.response?.data as { message?: unknown } | undefined;
    if (body && typeof body === "object" && typeof body.message === "string") {
      return body.message;
    }
    if (err.response?.status === 401) return "로그인이 필요해요.";
    return "주변 풍경을 불러오지 못했어요.";
  }
  if (err instanceof Error) return err.message;
  return "주변 풍경을 불러오지 못했어요.";
}
