import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";
import type { Theme } from "@/src/features/course/types";

import type {
  PlaceDetail,
  PlaceSearchResult,
  ThemedPlacesResponse,
} from "./types";

/**
 * GET /api/places/themed
 * - theme 지정 시 해당 테마 결과, 미지정 시 서버가 랜덤 테마 선택.
 * - 데이터 소스가 실시간 TourAPI 라 응답이 다소 느릴 수 있음(전역 timeout 10s 유지).
 * - CommonResponse.data 가 null 이면 서버 오류로 취급.
 */
export async function getThemedPlaces(
  theme?: Theme,
): Promise<ThemedPlacesResponse> {
  const res = await api.get<CommonResponse<ThemedPlacesResponse>>(
    "/api/places/themed",
    { params: theme ? { theme } : undefined },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * GET /api/places/search?query={검색어} — 카카오 로컬 장소 검색.
 * 502: 카카오 호출 실패 → 호출부에서 "장소 검색에 실패했어요" 안내.
 */
export async function searchPlaces(
  query: string,
): Promise<PlaceSearchResult[]> {
  const res = await api.get<CommonResponse<{ places: PlaceSearchResult[] }>>(
    "/api/places/search",
    { params: { query } },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data.places;
}

/**
 * GET /api/places/{content_id} — 여행지 상세.
 * 맛집·역 조회가 실패해도 상세 자체는 내려온다(각각 빈 배열·null).
 * 404: TourAPI 에 없거나 좌표가 없어 상세를 만들 수 없음 / 502: TourAPI 호출 실패.
 *
 * 실시간 TourAPI + 카카오 로컬을 함께 부르는 합성 응답이라 전역 10s 로는 모자랄 수 있어
 * timeout 을 20s 로 넉넉히 준다.
 */
export async function getPlaceDetail(
  contentId: string,
  restaurantLimit = 6,
): Promise<PlaceDetail> {
  const res = await api.get<CommonResponse<PlaceDetail>>(
    `/api/places/${contentId}`,
    { params: { restaurant_limit: restaurantLimit }, timeout: 20000 },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
