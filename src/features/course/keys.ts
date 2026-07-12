import type { RecommendCriteria } from "./types";

/**
 * recommend 관련 react-query key 팩토리.
 * criteria 전체 + page 를 키에 포함해 같은 조건의 이미 받은 page 는
 * 캐시에서 즉시 반환되도록 한다.
 */
export const recommendKeys = {
  all: ["recommend", "courses"] as const,
  detail: (criteria: RecommendCriteria) =>
    [...recommendKeys.all, criteria] as const,
};
