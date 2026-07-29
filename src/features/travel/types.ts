/**
 * /api/travels 요청·응답 스키마.
 * 서버 필드명(snake_case) 그대로 유지.
 */

export type TravelStatus = "PLANNED" | "ONGOING" | "COMPLETED";

/** POST /api/travels body */
export type TravelCreateRequest = {
  plan_id: string;
};

/** POST /api/travels 응답 */
export type TravelResponse = {
  travel_idx: number;
  title: string;
  start_date: string;
  end_date: string;
  region: string | null;
  status: TravelStatus;
  schedule_count: number;
};

/** GET /api/travels/current 응답. 진행중·예정 여행 없으면 서버가 data=null. */
export type HomeTravelCard = {
  travel_idx: number;
  title: string;
  start_date: string;
  end_date: string;
  status: TravelStatus;
  cover_image_url: string | null;
};

/**
 * GET /api/travels/past 카드 1건. 종료된 여행만 오므로 status 는 항상 COMPLETED.
 * liked: 내가 하트를 누른 여행인지 여부(표시 전용).
 */
export type PastTravelCard = {
  travel_idx: number;
  title: string;
  start_date: string;
  end_date: string;
  status: TravelStatus;
  cover_image_url: string | null;
  liked: boolean;
};

/** GET /api/travels/past 응답. 지난 여행 없으면 travels=[] , total=0. */
export type PastTravelListResponse = {
  travels: PastTravelCard[];
  total: number;
};

/** POST/DELETE /api/travels/{travel_idx}/likes 응답. 멱등이라 liked 는 서버 확정값. */
export type TravelLikeResponse = {
  travel_idx: number;
  liked: boolean;
};

/**
 * GET /api/travels/{travel_idx} — 여행 1건 일정표 상세.
 * days 는 day_no 오름차순, 각 day 의 items 는 sequence 오름차순으로 이미 정렬돼 온다.
 */
export type TravelDetail = {
  travel_idx: number;
  title: string;
  start_date: string;
  end_date: string;
  region: string | null;
  status: TravelStatus;
  days: TravelDay[];
};

export type TravelDay = {
  /** 1부터 시작하는 일차 */
  day_no: number;
  /** 해당 일차 날짜(ISO "YYYY-MM-DD") = start_date + (day_no-1) */
  date: string;
  items: TravelScheduleItem[];
};

/**
 * 일정 항목 1개. kind 로 표현이 갈린다("train" 이면 열차 정보 필드 사용).
 * 주의: start_time/end_time 은 ISO datetime 이 아니라 "HH:MM:SS" 시각 문자열이다.
 */
export type TravelScheduleItem = {
  schedule_idx: number;
  sequence: number;
  kind: string; // "train" 등
  title: string; // 기차는 'KTX 101 서울→부산' 형태
  train_no: string | null;
  train_grade: string | null;
  dep_station: string | null;
  arr_station: string | null;
  car_no: string | null;
  seat_no: string | null;
  start_time: string | null; // "09:33:00"
  end_time: string | null; // "09:33:00"
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  memo: string | null;
};
