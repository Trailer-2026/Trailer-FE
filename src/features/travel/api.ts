import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type {
  HomeTravelCard,
  PastTravelListResponse,
  TravelCreateRequest,
  TravelDetail,
  TravelLikeResponse,
  TravelResponse,
} from "./types";

/**
 * POST /api/travels
 * 결과 화면에서 선택한 Itinerary.plan_id 를 그대로 보낸다.
 * - 400 "추천이 만료되었습니다..." 로 응답할 수 있음. 호출부에서 문구 매칭 없이
 *   axios status 로 분기(호출부의 error 처리 참조).
 */
export async function createTravel(planId: string): Promise<TravelResponse> {
  const body: TravelCreateRequest = { plan_id: planId };
  const res = await api.post<CommonResponse<TravelResponse>>(
    "/api/travels",
    body,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * GET /api/travels/current
 * 진행중·예정 여행이 없으면 서버가 data=null 로 응답 → 여기서는 null 을 그대로 반환.
 * (recommend/stations 처럼 null 을 오류로 취급하지 않는다.)
 */
export async function getCurrentTravel(): Promise<HomeTravelCard | null> {
  const res = await api.get<CommonResponse<HomeTravelCard | null>>(
    "/api/travels/current",
  );
  return res.data.data;
}

/**
 * GET /api/travels/past
 * 종료된 여행을 종료일 내림차순으로 반환. 지난 여행이 없으면 travels=[] , total=0.
 * 401: client.ts 인터셉터가 refresh/로그아웃 처리.
 */
export async function getPastTravels(): Promise<PastTravelListResponse> {
  const res = await api.get<CommonResponse<PastTravelListResponse>>(
    "/api/travels/past",
  );
  // 없어도 data 는 빈 배열로 오지만, 방어적으로 null 이면 빈 목록으로 취급.
  return res.data.data ?? { travels: [], total: 0 };
}

/**
 * GET /api/travels/{travel_idx} — 여행 1건 일정표 상세(일자별 타임라인).
 * 404: 존재하지 않거나 본인 여행 아님 / 401: 인증 필요(client.ts 인터셉터 처리).
 */
export async function getTravelDetail(
  travelIdx: number,
): Promise<TravelDetail> {
  const res = await api.get<CommonResponse<TravelDetail>>(
    `/api/travels/${travelIdx}`,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * POST /api/travels/{travel_idx}/likes — 여행 좋아요.
 * 토글 아님(멱등). 이미 좋아요여도 에러 없이 liked=true 반환.
 * 404: 존재하지 않거나 본인 여행 아님 / 401: 인증 필요.
 */
export async function likeTravel(travelIdx: number): Promise<TravelLikeResponse> {
  const res = await api.post<CommonResponse<TravelLikeResponse>>(
    `/api/travels/${travelIdx}/likes`,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * DELETE /api/travels/{travel_idx}/likes — 여행 좋아요 취소.
 * 멱등. 좋아요 안 한 여행이어도 에러 없이 liked=false 반환.
 */
export async function unlikeTravel(
  travelIdx: number,
): Promise<TravelLikeResponse> {
  const res = await api.delete<CommonResponse<TravelLikeResponse>>(
    `/api/travels/${travelIdx}/likes`,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
