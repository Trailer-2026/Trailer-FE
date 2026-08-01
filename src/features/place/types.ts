import type { Theme } from "@/src/features/course/types";

/**
 * /api/places/themed 응답 스키마.
 * 서버 필드명(snake_case) 그대로 유지.
 * theme 는 서버가 실제로 고른 테마 — 요청 시 지정한 값이 아니라 이걸 신뢰해 UI 에 표시.
 */
export type ThemedPlacesResponse = {
  theme: Theme;
  title: string;
  banner_image_url: string | null;
  places: ThemePlaceCard[];
};

export type ThemePlaceCard = {
  name: string;
  region: string;
  image_url: string | null;
};

/**
 * GET /api/places/search 결과 1건(카카오 로컬 검색 기반).
 * name/latitude/longitude 를 그대로 visit 일정 추가에 사용한다.
 */
export type PlaceSearchResult = {
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
};
