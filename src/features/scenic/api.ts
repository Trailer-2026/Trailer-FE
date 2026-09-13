import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type {
  ScenicNearbyParams,
  ScenicNearbyResponse,
  ScenicPlanCalibrateRequest,
  ScenicPlanResponse,
} from "./types";

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
 * **조회 전용이다 — 푸시를 보내지 않는다.** (예전에는 호출마다 서버가 푸시를 쐈고,
 * 그래서 앱이 3분 폴링으로 발송 주기를 조절했다. 지금은 서버가 시각표로 직접
 * 발송하므로 폴링이 필요 없고, 이 API 는 화면에 "지금 창밖" 을 그릴 때만 쓴다.)
 *
 * 현재 화면에서는 쓰지 않는다 — 시각표(getScenicPlan)가 "앞으로 무엇이 언제" 를
 * 주므로 그쪽이 탑승 카드의 본문이다. 필요해지면 GPS 1회 + 이 호출로 붙이면 된다.
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

/**
 * GET /api/scenic-spots/plan — 지금 타고 있는(또는 3시간 안에 출발할) 열차가 가는
 * 길에 지날 풍경 구간 전체 + 통과 예정 시각.
 *
 * 대상 열차는 서버가 고른다(파라미터 없음). 해당 열차가 없으면 ride=null, items=[].
 * 서버가 이 시각표대로 푸시를 보내므로 이 호출은 화면을 그리기 위한 것일 뿐,
 * 호출 여부가 알림 발송에 영향을 주지 않는다.
 */
export async function getScenicPlan(): Promise<ScenicPlanResponse> {
  const res = await api.get<CommonResponse<ScenicPlanResponse>>(
    "/api/scenic-spots/plan",
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * POST /api/scenic-spots/plan/calibrate — 현재 좌표로 열차 지연을 계산해 남은
 * 알림 시각을 통째로 민다. 응답은 보정이 반영된 시각표(getScenicPlan 과 같은 형식).
 *
 * 실패하지 않는다 — 좌표가 경로에서 20km 넘게 벗어났거나(GPS 튐·열차 밖) 차이가
 * 90분을 넘으면 서버가 조용히 무시하고 보정 없는 시각표를 그대로 준다. 그래서
 * 앱은 응답을 항상 plan 캐시에 덮어써도 된다.
 *
 * 보정값은 서버 메모리에만 있다(서버 재시작 시 원래 예정 시각으로 복귀). 문서 권장은
 * "포그라운드로 올라올 때 1회" — queries.ts 가 그 빈도를 지킨다.
 */
export async function calibrateScenicPlan(
  body: ScenicPlanCalibrateRequest,
): Promise<ScenicPlanResponse> {
  const res = await api.post<CommonResponse<ScenicPlanResponse>>(
    "/api/scenic-spots/plan/calibrate",
    body,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
