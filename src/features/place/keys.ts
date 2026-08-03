import type { Theme } from "@/src/features/course/types";

/**
 * place 관련 react-query key 팩토리.
 * theme 미지정 랜덤 호출은 "random" 상수 키로 통합해 refetch 로 매번 갱신.
 */
export const placeKeys = {
  all: ["places"] as const,
  themed: (theme?: Theme) =>
    [...placeKeys.all, "themed", theme ?? "random"] as const,
  search: (query: string) => [...placeKeys.all, "search", query] as const,
};
