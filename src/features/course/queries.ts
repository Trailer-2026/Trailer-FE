import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { recommendCourses } from "./api";
import { recommendKeys } from "./keys";
import { RECOMMEND_MAX_PAGE, type RecommendCriteria } from "./types";

const STALE_MS = 1000 * 60 * 5; // 5분

/**
 * "일정 생성" / "다시받기" 트리거 시에만 호출되는 조건부 훅.
 * - enabled 로 자동실행 방지: criteria 가 준비되고 themes 가 1개 이상일 때만 호출.
 * - queryKey 에 criteria 전체(page 포함)를 넣어 같은 조건의 이전 page 는 캐시 히트.
 */
export function useRecommendCourses(criteria: RecommendCriteria | null) {
  return useQuery({
    queryKey: criteria ? recommendKeys.detail(criteria) : recommendKeys.all,
    queryFn: () => recommendCourses(criteria!),
    enabled: !!criteria && criteria.themes.length > 0,
    staleTime: STALE_MS,
  });
}

/**
 * 결과 표시 중 다음 page 를 백그라운드 프리페치.
 * 사용자가 "다시받기" 를 누르면 캐시 히트로 즉시 표시된다.
 * 최대 page(=RECOMMEND_MAX_PAGE) 도달 시 no-op.
 */
export function usePrefetchNextRecommendPage() {
  const queryClient = useQueryClient();

  return useCallback(
    (criteria: RecommendCriteria) => {
      const nextPage = criteria.page + 1;
      if (nextPage > RECOMMEND_MAX_PAGE) return;
      const nextCriteria: RecommendCriteria = { ...criteria, page: nextPage };
      queryClient.prefetchQuery({
        queryKey: recommendKeys.detail(nextCriteria),
        queryFn: () => recommendCourses(nextCriteria),
        staleTime: STALE_MS,
      });
    },
    [queryClient],
  );
}
