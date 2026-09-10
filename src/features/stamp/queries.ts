import { useQuery } from "@tanstack/react-query";

import { CACHE_POLICY } from "@/src/api/cache-policy";

import { getMyStamps } from "./api";

/** stamp 관련 react-query key 팩토리. */
export const stampKeys = {
  all: ["stamps"] as const,
  list: () => [...stampKeys.all, "list"] as const,
};

/**
 * 내 스탬프 목록.
 * 달성 판정은 다녀온 여행 기준이라 자주 바뀌지 않는다(OWNED).
 */
export function useMyStamps() {
  return useQuery({
    queryKey: stampKeys.list(),
    queryFn: getMyStamps,
    ...CACHE_POLICY.OWNED,
  });
}
