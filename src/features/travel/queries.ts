import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createTravel, getCurrentTravel } from "./api";
import { travelKeys } from "./keys";

/**
 * 현재 진행중·예정 여행 조회. 없으면 data=null.
 * - 홈 진입 시 자동 실행.
 * - 저장 직후 mutation 이 invalidate 하므로 자동 갱신됨.
 */
export function useCurrentTravel() {
  return useQuery({
    queryKey: travelKeys.current(),
    queryFn: getCurrentTravel,
    staleTime: 1000 * 60, // 1분
  });
}

/**
 * "이 일정 선택하기" 저장.
 * - 성공 시 travels/current 를 invalidate 하여 홈 카드가 자동 갱신되게 한다.
 * - 400 만료 에러는 호출부에서 axios status 로 분기.
 */
export function useCreateTravel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => createTravel(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: travelKeys.current() });
    },
  });
}
