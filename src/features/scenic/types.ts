/**
 * GET /api/scenic-spots/nearby — 실시간 창밖 풍경(관광지) 조회 스키마.
 * 서버 필드명(snake_case) 그대로 유지.
 */

/** 진행 방향 기준 창밖 좌/우. */
export type ScenicSide = "left" | "right";

export type ScenicSpotItem = {
  name: string;
  category: string;
  /** 현재 위치로부터의 거리(m) */
  distance_m: number;
  side: ScenicSide;
};

/**
 * 현재 위치 1500m 이내 + 진행 방향(도착역 방위) ±100° 관광지를 거리순 top3.
 * 보이는 관광지가 없으면 items 는 빈 배열로 온다.
 */
export type ScenicNearbyResponse = {
  /** 서버 조회 시각(KST ISO). "오전 9:00 기준" 문구는 프론트가 이 값으로 만든다. */
  based_at: string;
  feature_count: number;
  items: ScenicSpotItem[];
};

/** 쿼리 파라미터 — 전부 필수. 역명은 여행 상세의 train 항목 값을 그대로 쓴다. */
export type ScenicNearbyParams = {
  lat: number;
  lng: number;
  from_station: string;
  to_station: string;
};
