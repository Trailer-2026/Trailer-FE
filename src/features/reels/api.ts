import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type { LikeResponse } from "./types";

/**
 * 좋아요 API.
 *
 * 두 요청 모두 멱등이라 이미 눌린 상태에서 다시 호출해도 안전하다.
 * 응답의 liked/like_count 가 서버 확정값이므로 UI 는 이 값으로 덮어쓴다.
 * 404: 릴스 없음 / 401: 인증 필요(client.ts 인터셉터가 재발급·로그아웃 처리).
 *
 * NOTE: 현재 릴스 목록이 목업이라 화면에서 아직 호출하지 않는다.
 *       실제 릴스 조회 API 가 붙으면 store.ts 의 toggleLike 에서 호출한다.
 */
export async function likeReels(reelsIdx: number): Promise<LikeResponse> {
  const res = await api.post<CommonResponse<LikeResponse>>(
    `/api/reels/${reelsIdx}/likes`,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

export async function unlikeReels(reelsIdx: number): Promise<LikeResponse> {
  const res = await api.delete<CommonResponse<LikeResponse>>(
    `/api/reels/${reelsIdx}/likes`,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
