/**
 * GET /api/users/me/stamps — 마이페이지 '스탬프' 탭 데이터.
 * 서버 필드명(snake_case) 그대로 유지.
 */

/** 스탬프 1칸. 미달성 칸도 그대로 내려오므로 목록 순서대로 그리면 된다. */
export type Stamp = {
  /** 서버 enum (FIRST_TRAIN_TRIP, AI_COURSE_DONE, SCENERY_PHOTOS 등) */
  type: string;
  title: string;
  description: string;
  image_url: string;
  achieved: boolean;
  /** 현재 진행 수치 (예: 10곳 중 3곳이면 3) */
  progress: number;
  /** 달성 기준 수치 */
  goal: number;
  /** 미달성이면 null */
  achieved_at: string | null;
};

export type StampListResponse = {
  /** 상단 '배지 달성 현황 N개' */
  achieved_count: number;
  total_count: number;
  stamps: Stamp[];
};
