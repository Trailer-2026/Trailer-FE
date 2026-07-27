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
