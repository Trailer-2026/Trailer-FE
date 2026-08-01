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

/**
 * POST /api/travels/{travel_idx}/schedules 요청. kind 로 분기되는 유니온.
 * sequence 는 서버가 그날 마지막 뒤로 자동 배정하므로 보내지 않는다.
 */
export type ScheduleCreateRequest = VisitScheduleCreate | TrainScheduleCreate;

/** 장소(visit) 추가 — 좌표는 장소 검색 결과에서 채운다. */
export type VisitScheduleCreate = {
  kind: "visit";
  day_no: number;
  start_time: string; // "HH:MM:SS"
  title: string;
  latitude: number;
  longitude: number;
  end_time?: string; // 미지정 시 서버가 방문 시각과 동일 처리
  image_url?: string;
  memo?: string;
};

/**
 * 티켓(train) 추가.
 * day_no 는 서버가 출발일로 계산, 좌표는 서버가 출발역명으로 조회하므로 보내지 않는다.
 */
export type TrainScheduleCreate = {
  kind: "train";
  dep_date: string; // "YYYY-MM-DD"
  arr_date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM:SS" 출발
  end_time: string; // "HH:MM:SS" 도착
  train_no: string;
  train_grade: string;
  dep_station: string;
  arr_station: string;
  car_no?: string;
  seat_no?: string;
  memo?: string;
};

/**
 * PATCH /api/travels/{travel_idx}/schedules/{schedule_idx} 요청.
 * 부분 수정 — 변경할 필드만 담아 보낸다(나머지는 유지). day_no·kind 는 변경 불가라 없음.
 */
export type ScheduleUpdateRequest = {
  title?: string;
  start_time?: string;
  end_time?: string;
  memo?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  train_no?: string;
  train_grade?: string;
  dep_station?: string;
  arr_station?: string;
  car_no?: string;
  seat_no?: string;
};
