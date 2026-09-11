import { useQuery } from "@tanstack/react-query";

import { CACHE_POLICY } from "@/src/api/cache-policy";

import { recommendCourses } from "./api";
import { recommendKeys } from "./keys";
import type { RecommendCriteria } from "./types";

/**
 * "일정 생성" / "다시받기" 트리거 시에만 호출되는 조건부 훅.
 * - enabled 로 자동실행 방지: criteria 가 준비되고 themes 가 1개 이상일 때만 호출.
 * - queryKey 에 criteria 전체(page 포함)를 넣어 같은 조건의 이전 page 는 캐시 히트.
 * - retry 0: AI 추천은 응답이 오래 걸려 자동 재시도 시 대기시간이 크게 늘어남 → 사용자 액션으로만 재시도.
 */
export function useRecommendCourses(criteria: RecommendCriteria | null) {
  return useQuery({
    queryKey: criteria ? recommendKeys.detail(criteria) : recommendKeys.all,
    queryFn: () => recommendCourses(criteria!),
    enabled: !!criteria && criteria.themes.length > 0,
    ...CACHE_POLICY.LOOKUP,
    retry: 0,
  });
}
