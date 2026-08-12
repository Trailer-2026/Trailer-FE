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
  /**
   * TourAPI 콘텐츠 ID — 상세 화면(GET /api/places/{content_id}) 진입에 쓴다.
   * 선택인 이유: 정적 프리시드(seed.ts)에는 없어서, 없으면 카드를 눌러도 이동하지 않는다.
   */
  content_id?: string;
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

/**
 * GET /api/places/{content_id} — 여행지 상세(지역 소개 + 가까운 맛집).
 * 홈 '테마별 여행지' 카드를 눌렀을 때의 화면 데이터.
 */
export type PlaceDetail = {
  content_id: string;
  name: string;
  /** 상단 큰 제목 */
  headline: string;
  themes: string[];
  address: string;
  latitude: number;
  longitude: number;
  /** 대표 사진이 첫 장 */
  images: string[];
  /** 소개글(평문) */
  overview: string;
  tel: string | null;
  homepage: string | null;
  /** 1.5km 안에 역이 없으면 null → 해당 줄을 숨긴다. */
  nearest_station: NearestStation | null;
  restaurants: NearbyRestaurant[];
};

export type NearestStation = {
  station_name: string;
  line: string | null;
  distance_m: number;
  walk_minutes: number;
  /** "양천향교역에서 도보 10~11분" — 그대로 노출하면 된다. */
  text: string;
};

export type NearbyRestaurant = {
  content_id: string;
  name: string;
  category: string;
  address: string;
  image_url: string | null;
  distance_m: number;
  latitude: number;
  longitude: number;
};
