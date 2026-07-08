/**
 * /api/recommend/courses 요청·응답 스키마.
 * 필드명은 서버 snake_case 그대로 유지한다.
 */

/**
 * 여행 스타일 enum. 서버에서 허용하는 8종.
 * UI 한글 태그(#자연힐링 등) → 이 enum 값 매핑은 store.ts 의 mapStyleToTheme 참고.
 */
export type Theme =
  | "NATURE"
  | "OCEAN"
  | "HISTORY"
  | "CITY"
  | "HEALING"
  | "FOOD"
  | "CULTURE"
  | "THEME_PARK";

/** 인원. 서버 기준 세 구분값(어른/청소년/어린이) */
export type Party = {
  adult: number;
  youth: number;
  child: number;
};

/**
 * 요청 바디.
 * - go_time / back_time: 모르면 반드시 null (빈 문자열 금지)
 * - max_travel_minutes: 없으면 null (0 대신)
 * - via_station_idx: 없으면 null
 * - page: 0=최초, 최대 3. 다시받기 시 +1
 */
export type RecommendCriteria = {
  origin_station_idx: number;
  dest_station_idx: number | null;
  round_trip: boolean;
  go_date: string; // "YYYYMMDD"
  go_time: string | null; // "HH:MM" | null
  back_date: string; // "YYYYMMDD"
  back_time: string | null;
  party: Party;
  themes: Theme[];
  max_travel_minutes: number | null;
  via_station_idx: number | null;
  use_naeilpass: boolean;
  page: number;
};

export type TrainInfo = {
  train_no: string;
  grade: string;
  dep_station: string;
  arr_station: string;
  dep_time: string; // ISO8601(+09:00)
  arr_time: string;
  duration_minutes: number;
  fare: number;
  stop_station_count: number;
  stop_stations: string[];
};

export type PlaceInfo = {
  place_idx: number;
  name: string;
  region: string;
  lat: number;
  lng: number;
  themes: string[];
  preference_score: number;
  reason: string;
  image_url: string | null;
  open_time: string | null;
  close_time: string | null;
  visit_time: string | null;
};

export type LodgingInfo = {
  name: string;
  lodging_type: string;
  region: string;
  lat: number;
  lng: number;
  tel: string | null;
  image_url: string | null;
};

export type SegmentKind = "train" | "visit" | "lodging";

export type Segment = {
  kind: SegmentKind;
  day_no: number;
  start_time: string | null; // ISO8601(+09:00)
  end_time: string | null;
  train: TrainInfo | null;
  place: PlaceInfo | null;
  lodging: LodgingInfo | null;
};

export type Itinerary = {
  /** 저장 요청(POST /api/travels) 시 서버에 보내는 캐시 키. 응답 시점에 서버가 발급. */
  plan_id: string;
  plan_label: string;
  title: string;
  main_themes: string[];
  cover_image_url: string | null;
  label: string;
  route_type: string;
  via_station_idx: number | null;
  segments: Segment[];
  total_preference_score: number;
  total_travel_minutes: number;
  total_fare: number;
  is_round_trip_closed: boolean;
  note: string | null;
};

export type DestinationPlan = {
  destination_station_idx: number;
  destination_name: string;
  score: number | null;
  itineraries: Itinerary[];
  note: string | null;
};

export type RecommendResponse = {
  auto_selected: boolean;
  destinations: DestinationPlan[];
  note: string | null;
};

/** 다시받기 시 서버가 허용하는 최대 page 번호 */
export const RECOMMEND_MAX_PAGE = 3;
