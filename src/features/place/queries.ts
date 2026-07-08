import { useQuery } from "@tanstack/react-query";

import type { Theme } from "@/src/features/course/types";

import { getThemedPlaces } from "./api";
import { placeKeys } from "./keys";

const FIXED_STALE_MS = 1000 * 60 * 5; // 고정 theme: 5분 캐시

/**
 * 테마별 관광지 조회.
 * - 고정 theme (예: NATURE): 5분 캐시 → 같은 화면 재진입 시 즉시.
 * - 랜덤 (theme 미지정): staleTime 0 + refetch() 로 매번 새 결과 보장.
 *   ('다른 테마' 버튼이 refetch 를 트리거하는 UX 라 캐시 재사용 X)
 */
export function useThemedPlaces(theme?: Theme) {
  return useQuery({
    queryKey: placeKeys.themed(theme),
    queryFn: () => getThemedPlaces(theme),
    staleTime: theme ? FIXED_STALE_MS : 0,
  });
}
