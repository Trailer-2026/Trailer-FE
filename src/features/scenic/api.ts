import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type { ScenicNearbyParams, ScenicNearbyResponse } from "./types";

/**
 * GET /api/scenic-spots/nearby — 현재 위치에서 창밖으로 보이는 관광지 top3.
 *
 * ⚠️ **이 API 는 호출할 때마다 풍경 알림 푸시를 함께 발송한다.**
 *    즉 "호출 = 알림 1건"이므로 절대 자유롭게 부르지 말 것.
 *    호출 빈도 제어는 queries.ts 의 useScenicPolling 한 곳에서만 한다
 *    (3분 간격 · 백그라운드 스킵 · 미이동 스킵). 다른 곳에서 직접 부르지 않는다.
 *
 * 401: client.ts 인터셉터가 refresh/로그아웃 처리.
 */
export async function getNearbyScenicSpots(
  params: ScenicNearbyParams,
): Promise<ScenicNearbyResponse> {
  const res = await api.get<CommonResponse<ScenicNearbyResponse>>(
    "/api/scenic-spots/nearby",
    { params },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
