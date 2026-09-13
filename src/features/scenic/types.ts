/**
 * 풍경 알림 스키마. 서버 필드명(snake_case) 그대로 유지.
 *
 * 알림 발송 주체는 **서버**다 — 열차 시간표로 통과 시각을 계산해 그 시각에 푸시를
 * 보낸다. 앱은 시각표를 보여주고(GET /plan) GPS 로 지연을 보정(POST /plan/calibrate)
 * 할 뿐, 아무것도 안 해도 알림은 온다.
 */

/** 진행 방향 기준 창밖 좌/우. 방향을 못 정한 스팟은 null. */
export type ScenicSide = "left" | "right";

/** 서버 분류. 이 넷 외의 값이 와도 깨지지 않게 string 으로 받는다. */
export type ScenicCategory = "water" | "waterway" | "peak" | "natural_view";

/* ------------------------------------------------------------------ */
/* GET /api/scenic-spots/nearby — 현재 위치 기준 창밖 관광지 (조회 전용)    */
/* ------------------------------------------------------------------ */

export type ScenicSpotItem = {
  name: string | null;
  category: ScenicCategory | string;
  /** 현재 위치로부터의 거리(m) */
  distance_m: number;
  side: ScenicSide | null;
  /** 카테고리 일러스트 URL(공개). 버킷 설정이 없으면 null. */
  image_url: string | null;
};

/**
 * 현재 위치 1500m 이내 + 진행 방향(도착역 방위) ±100° 관광지를 거리순 top3.
 * 보이는 관광지가 없으면 items 는 빈 배열로 온다.
 */
export type ScenicNearbyResponse = {
  /** 서버 조회 시각(KST ISO, 타임존 포함). */
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

/* ------------------------------------------------------------------ */
/* GET /api/scenic-spots/plan · POST /api/scenic-spots/plan/calibrate    */
/* ------------------------------------------------------------------ */

/**
 * 시각표의 대상 탑승. **서버가 고른다** — 지금 타고 있는 열차, 없으면 3시간 안에
 * 출발할 열차. 앱이 travel_idx 를 넘기지 않는다.
 *
 * schedule_idx(추천 코스 승차권) / ticket_idx(직접 입력 승차권) 중 하나만 채워진다.
 */
export type ScenicPlanRide = {
  travel_idx: number | null;
  schedule_idx: number | null;
  ticket_idx: number | null;
  /** '역' 포함("서울역") — 일정표의 dep_station('역' 없음)과 표기가 다르다. */
  dep_station: string;
  arr_station: string;
  /** KST wall-clock, 타임존 없음("2026-08-16T09:00:00"). UTC 로 해석하지 말 것. */
  dep_at: string;
  arr_at: string;
};

export type ScenicPlanItem = {
  /** 대표 관광지 PK. 푸시 data.scenic_spot_idx 와 같은 값. */
  scenic_spot_idx: number;
  name: string | null;
  category: ScenicCategory | string;
  side: ScenicSide | null;
  /** 구간 시작역('역' 포함) */
  from_station: string;
  /** 구간 도착역('역' 포함). 알림 문구의 "지금 OO역 스팟을 지나고 있어요" */
  to_station: string;
  /**
   * 통과 예정 시각(KST wall-clock, 타임존 없음). 역 간 직선거리 비율로 나눈
   * **추정값**이라 몇 분 오차가 있다. calibrate 로 보정하면 밀린 값이 온다.
   */
  eta: string;
  image_url: string | null;
  /** 서버가 이 구간의 푸시를 이미 보냈는지. true 면 앱이 다시 안내하지 않는다. */
  is_sent: boolean;
};

/** GET /plan 과 POST /plan/calibrate 의 응답 형식이 완전히 같다. */
export type ScenicPlanResponse = {
  /** 응답 생성 시각(KST ISO, 타임존 포함) */
  based_at: string;
  /** 타고 있는 열차도, 곧 출발할 열차도 없으면 null */
  ride: ScenicPlanRide | null;
  /** 마지막 GPS 보정으로 확인된 지연(분). 양수 = 예정보다 늦게 가는 중. 보정 전엔 0. */
  delay_minutes: number;
  /** 통과 예정 시각순. 대상 탑승이 없으면 빈 배열 */
  items: ScenicPlanItem[];
};

export type ScenicPlanCalibrateRequest = {
  lat: number;
  lng: number;
};
