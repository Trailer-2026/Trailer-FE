import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type { RecommendCriteria, RecommendResponse } from "./types";

/**
 * AI 추천 응답이 오래 걸리는 편이라 클라이언트 전역 timeout(10s) 대신
 * 이 요청만 넉넉히 잡는다.
 *
 * 서버 앞단 nginx 의 proxy_read_timeout 도 2분으로 맞춘다 — 로딩 화면의
 * "최대 2분" 안내와 같은 값이라, 이보다 짧으면 안내보다 먼저 504(HTML)로 끊긴다.
 * (nginx 가 60초였을 때 실제로 60.9초에 504 로 끝나는 것을 확인했다.)
 */
const RECOMMEND_TIMEOUT_MS = 120_000;

/**
 * POST /api/recommend/courses
 * - 사용자가 "일정 생성" / "다시받기"를 눌렀을 때만 호출한다.
 * - CommonResponse.data 가 null 이면 서버 오류로 취급하고 message 를 throw.
 * - 요청 스키마 관련 주의:
 *   - 시간 필드(go_time / back_time)는 값이 없으면 반드시 null.
 *     "" 또는 문자열 "string" 을 보내면 서버가 400.
 *   - max_travel_minutes / via_station_idx 도 없으면 null (0 대신).
 */
export async function recommendCourses(
  criteria: RecommendCriteria,
): Promise<RecommendResponse> {
  const res = await api.post<CommonResponse<RecommendResponse>>(
    "/api/recommend/courses",
    criteria,
    { timeout: RECOMMEND_TIMEOUT_MS },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
