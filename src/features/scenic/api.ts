import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type { ScenicNearbyParams, ScenicNearbyResponse } from "./types";

/**
 * 역명 정규화 — 서버는 `역` 접미사가 붙은 이름("오송역")을 기준으로 구간을 찾는다.
 * 반면 앱의 여행 일정은 승차권에서 온 접미사 없는 이름("서울"·"부산")을 들고 있어,
 * 그대로 보내면 구간 매칭이 실패해 items 가 항상 빈 배열로 내려온다.
 *
 * 이미 붙어 있으면 그대로 둔다 — 이름 자체가 `역`으로 끝나는 역도
 * 마찬가지로 안전하다("역곡" → "역곡역", "역곡역" → "역곡역").
 *
 * ⚠️ 정규화는 이 요청 경계에서만 한다. 세션·일정표는 승차권 표기를 그대로 써야
 *    화면에 "서울 → 부산" 으로 보인다(여기서 바꾸면 "서울역 → 부산역" 이 된다).
 */
export function normalizeStationName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  return trimmed.endsWith("역") ? trimmed : `${trimmed}역`;
}

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
    {
      params: {
        ...params,
        from_station: normalizeStationName(params.from_station),
        to_station: normalizeStationName(params.to_station),
      },
    },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
