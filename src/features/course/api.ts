import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type { RecommendCriteria, RecommendResponse } from "./types";

/**
 * AI 추천 응답이 오래 걸리는 편이라 클라이언트 전역 timeout(10s) 대신
 * 이 요청만 넉넉히 잡는다.
 *
 * 참고: 서버 앞단 nginx 가 60초에 끊고 504(HTML)를 돌려주는 것을 확인했다
 * (측정값 60.9초). 그래서 이 값을 늘려도 지금은 60초쯤에 504 로 끝난다 —
 * 서버 proxy_read_timeout 이 올라가면 그만큼 앱도 기다릴 수 있게 여유를 둔 값이다.
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
