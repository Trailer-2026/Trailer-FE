import type { StationsQueryParams } from "./types";

/**
 * station 관련 react-query key 팩토리.
 * - 전역에서 이 팩토리만 참조하면 invalidateQueries 시 실수 방지.
 * - 파라미터 유무·값에 따라 자연스럽게 세분화된 캐시가 만들어진다.
 */
export const stationKeys = {
  all: ["stations"] as const,
  list: (params?: StationsQueryParams) => [...stationKeys.all, params ?? {}] as const,
};
