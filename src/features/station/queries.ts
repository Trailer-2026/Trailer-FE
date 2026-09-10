import { useQuery } from "@tanstack/react-query";

import { CACHE_POLICY } from "@/src/api/cache-policy";

import { getStations } from "./api";
import { stationKeys } from "./keys";
import type { StationsQueryParams } from "./types";

/**
 * 역 목록 조회.
 * - 역 데이터는 거의 바뀌지 않으므로 STATIC 정책으로 재호출을 줄인다.
 * - 향후 검색창(query) / 초성필터(initial) UI 를 얹으면 params 만 넘기면 된다.
 */
export function useStations(params?: StationsQueryParams) {
  return useQuery({
    queryKey: stationKeys.list(params),
    queryFn: () => getStations(params),
    ...CACHE_POLICY.STATIC,
  });
}
