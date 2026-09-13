import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type { RecommendCriteria, RecommendResponse } from "./types";

/**
 * AI 추천 응답이 오래 걸리는 편이라 클라이언트 전역 timeout(10s) 대신
 * 이 요청만 넉넉히 잡는다. 화면 안내 문구는 여전히 "최대 2분" 이지만, 드물게
 * 그보다 오래 걸려 실패하는 사례가 있어 여유를 180초로 늘렸다.
 *
 * 주의: 서버 앞단 nginx 의 proxy_read_timeout 이 이보다 짧으면(예: 이전의 2분)
 * 클라이언트가 기다려도 그 전에 nginx 가 먼저 504(HTML)로 끊는다 — 이 값을
 * 올린 만큼 nginx proxy_read_timeout 도 180초 이상으로 같이 맞춰야 실제로
 * 효과가 있다. (nginx 가 60초였을 때 실제로 60.9초에 504 로 끝나는 것을 확인했다.)
 */
const RECOMMEND_TIMEOUT_MS = 180_000;

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
