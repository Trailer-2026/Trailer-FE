import { useQuery } from "@tanstack/react-query";

import type { Theme } from "@/src/features/course/types";
import { useDebouncedValue } from "@/src/utils/useDebouncedValue";

import { getThemedPlaces, searchPlaces } from "./api";
import { placeKeys } from "./keys";
import { NATURE_SEED } from "./seed";

const FIXED_STALE_MS = 1000 * 60 * 5; // 고정 theme: 5분 캐시

/**
 * 테마별 관광지 조회.
 * - 고정 theme (예: NATURE): 5분 캐시 → 같은 화면 재진입 시 즉시.
 * - 랜덤 (theme 미지정): staleTime 0 + refetch() 로 매번 새 결과 보장.
 *   ('다른 테마' 버튼이 refetch 를 트리거하는 UX 라 캐시 재사용 X)
 *
 * NATURE(홈 기본 테마)만 정적 스냅샷(NATURE_SEED)을 initialData 로 심어
 * 첫 진입 시 스피너 없이 즉시 렌더한다. initialDataUpdatedAt: 0 으로 곧바로
 * stale 처리해 마운트 직후 실제 데이터를 백그라운드에서 조용히 교체한다.
 */
export function useThemedPlaces(theme?: Theme) {
  const isNature = theme === "NATURE";
  return useQuery({
    queryKey: placeKeys.themed(theme),
    queryFn: () => getThemedPlaces(theme),
    staleTime: theme ? FIXED_STALE_MS : 0,
    initialData: isNature ? NATURE_SEED : undefined,
    initialDataUpdatedAt: isNature ? 0 : undefined,
  });
}

/**
 * 장소 검색(일정 추가용).
 * - 입력값을 debounce(350ms)해 키 입력마다 요청이 나가지 않게 한다.
 * - 검색어가 비면 비활성(enabled:false).
 * - 502 등 실패는 호출부에서 error 로 "장소 검색 실패" 안내.
 */
export function usePlaceSearch(query: string) {
  const debounced = useDebouncedValue(query.trim(), 350);
  return useQuery({
    queryKey: placeKeys.search(debounced),
    queryFn: () => searchPlaces(debounced),
    enabled: debounced.length >= 1,
    staleTime: 1000 * 60,
  });
}
