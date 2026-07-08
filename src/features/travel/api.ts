import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type {
  HomeTravelCard,
  TravelCreateRequest,
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
