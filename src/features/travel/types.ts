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
