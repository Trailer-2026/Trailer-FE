/**
 * /api/travels 요청·응답 스키마.
 * 서버 필드명(snake_case) 그대로 유지.
 */

export type TravelStatus = "PLANNED" | "ONGOING" | "COMPLETED";

/** POST /api/travels body */
export type TravelCreateRequest = {
  plan_id: string;
};

/**
 * POST /api/travels/manual body — 추천 없이 빈 여행 1건을 직접 만든다.
 * 일정 항목은 생성 후 POST /{travel_idx}/schedules 로 하나씩 붙인다.
 * title/region 은 선택 — title 을 비우면 서버가 지역·기간으로 자동 생성한다.
 */
export type TravelManualCreateRequest = {
  start_date: string; // "YYYY-MM-DD"
  end_date: string; // "YYYY-MM-DD"
  title?: string;
  region?: string;
};

/**
 * PATCH /api/travels/{travel_idx} body — 여행 제목 변경.
 * 빈 값·공백을 보내면 서버가 지역·기간으로 자동 생성('부산 2박 3일 여행' 형태).
 */
export type TravelUpdateRequest = {
  title: string;
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
 * 일정에 붙은 사용자 사진 1장(여행 상세 응답의 `images`).
 * image_idx 는 삭제(DELETE /api/travels/{travel_idx}/images/{image_idx})에 쓴다.
 */
export type TravelScheduleImage = {
  image_idx: number;
  schedule_idx: number | null;
  url: string;
};

/**
 * 일정 항목 1개. kind 로 표현이 갈린다("train" 이면 열차 정보 필드 사용).
 * 주의: start_time/end_time 은 ISO datetime 이 아니라 "HH:MM:SS" 시각 문자열이다.
 *
 * image_url 은 관광지 대표 이미지(서버가 주는 것), images 는 **사용자가 올린 사진**이다.
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
  /** 사용자가 이 일정에 붙인 사진들. 없으면 빈 배열(옛 응답은 아예 없을 수 있다). */
  images?: TravelScheduleImage[];
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
  dep_station: string;
  arr_station: string;
  /** 서버가 kind=train 에서 필수로 요구한다(누락 시 400). */
  train_no: string;
  train_grade: string;
  car_no?: string;
  seat_no?: string;
  memo?: string;
};

/**
 * PATCH/DELETE /api/travels/{travel_idx}/cover-image 응답.
 * 삭제 시에도 원래 규칙(첫 일정 이미지 → 지역 기본 사진)으로 되돌아간 URL 이 담긴다.
 */
export type TravelCoverResponse = {
  travel_idx: number;
  cover_image_url: string | null;
};

/** multipart 업로드에 넣을 이미지 파일 형태. expo-image-picker asset 에서 좁혀서 만든다. */
export type TravelCoverFile = {
  uri: string;
  name: string;
  type: string;
};

/**
 * GET /api/travels/{travel_idx}/tickets — 승차권 1매(= 기차 일정 1건).
 * 좌석·호차는 예매 정보라 없을 수 있다.
 */
export type TravelTicket = {
  schedule_idx: number;
  day_no: number;
  /** 승차 일자 "YYYY-MM-DD" */
  date: string;
  train_grade: string;
  train_no: string;
  dep_station: string;
  arr_station: string;
  /** "HH:MM:SS" */
  dep_time: string;
  arr_time: string;
  car_no: string | null;
  seat_no: string | null;
};

export type TravelTicketListResponse = {
  travel_idx: number;
  tickets: TravelTicket[];
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
