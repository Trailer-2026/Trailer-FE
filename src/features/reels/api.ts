import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type { LikeResponse, ReelsComment, ReelsRecommendItem } from "./types";

/**
 * 릴스 댓글 목록(작성순). GET /api/reels/{reels_idx}/comments
 * 답글은 각 최상위 댓글의 replies 에 담겨 온다. 401: 인증 필요 / 404: 릴스 없음.
 */
export async function getReelsComments(
  reelsIdx: number,
): Promise<ReelsComment[]> {
  const res = await api.get<CommonResponse<ReelsComment[]>>(
    `/api/reels/${reelsIdx}/comments`,
  );
  return res.data.data ?? [];
}

/**
 * 릴스 댓글 작성. POST /api/reels/{reels_idx}/comments
 *
 * parentIdx 를 주면 그 댓글의 답글로 달린다(답글은 1단계까지만).
 * 400: 답글에 답글을 달거나 다른 릴스의 댓글을 parent 로 지정 / 404: 릴스·부모 댓글 없음 / 401: 인증 필요.
 */
export async function postReelsComment(
  reelsIdx: number,
  content: string,
  parentIdx: number | null,
): Promise<ReelsComment> {
  const res = await api.post<CommonResponse<ReelsComment>>(
    `/api/reels/${reelsIdx}/comments`,
    { content, parent_idx: parentIdx },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * 릴스 무작위 추천 10개. GET /api/videos/reels/recommend
 *
 * exclude 에 이미 받은 reels_idx 를 누적해 넘기면 그만큼 빼고 새로 뽑는다.
 * 남은 게 없으면 서버가 exclude 를 무시하고 처음부터 다시 추천하므로,
 * 무한 스크롤은 "이번 페이지가 전부 이미 본 것"이면 멈춘다(queries.ts).
 */
export async function getRecommendedReels(
  exclude: number[],
  limit?: number,
): Promise<ReelsRecommendItem[]> {
  const res = await api.get<CommonResponse<ReelsRecommendItem[]>>(
    "/api/videos/reels/recommend",
    {
      params: {
        ...(exclude.length ? { exclude: exclude.join(",") } : {}),
        ...(limit ? { limit } : {}),
      },
    },
  );
  return res.data.data ?? [];
}

/**
 * 좋아요 API (릴스 / 댓글).
 *
 * 네 요청 모두 멱등이라 이미 눌린 상태에서 다시 호출해도 안전하다.
 * 응답의 liked/like_count 가 서버 확정값이므로 UI 는 이 값으로 덮어쓴다.
 * 404: 대상 없음 / 401: 인증 필요(client.ts 인터셉터가 재발급·로그아웃 처리).
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

/** 댓글·답글 공통. 경로가 릴스가 아니라 comment_idx 기준이라 답글도 그대로 쓴다. */
export async function likeComment(commentIdx: number): Promise<LikeResponse> {
  const res = await api.post<CommonResponse<LikeResponse>>(
    `/api/comments/${commentIdx}/likes`,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

export async function unlikeComment(commentIdx: number): Promise<LikeResponse> {
  const res = await api.delete<CommonResponse<LikeResponse>>(
    `/api/comments/${commentIdx}/likes`,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
