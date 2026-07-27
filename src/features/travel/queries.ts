import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTravel,
  getCurrentTravel,
  getPastTravels,
  likeTravel,
  unlikeTravel,
} from "./api";
import { travelKeys } from "./keys";
import type { PastTravelListResponse } from "./types";

/** past 목록 캐시에서 특정 여행의 liked 를 갱신하는 헬퍼. */
function setLikedInPast(
  data: PastTravelListResponse | undefined,
  travelIdx: number,
  liked: boolean,
): PastTravelListResponse | undefined {
  if (!data) return data;
  return {
    ...data,
    travels: data.travels.map((t) =>
      t.travel_idx === travelIdx ? { ...t, liked } : t,
    ),
  };
}

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
 * 지난 여행(종료된 여행) 목록 조회. 여행 조회 화면 진입 시 자동 실행.
 * 없으면 travels=[] 로 온다.
 */
export function usePastTravels() {
  return useQuery({
    queryKey: travelKeys.past(),
    queryFn: getPastTravels,
    staleTime: 1000 * 60, // 1분
  });
}

/**
 * 지난 여행 카드 좋아요 토글.
 * - currentlyLiked=true 면 취소(DELETE), false 면 좋아요(POST). 둘 다 멱등.
 * - 낙관적 업데이트: 누르는 즉시 past 캐시의 liked 를 뒤집어 카드가 주요/지난 섹션 사이를
 *   바로 이동하게 하고, 실패하면 롤백한다. 성공 시 서버 확정값으로 재정합.
 */
export function useToggleTravelLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      travelIdx,
      currentlyLiked,
    }: {
      travelIdx: number;
      currentlyLiked: boolean;
    }) => (currentlyLiked ? unlikeTravel(travelIdx) : likeTravel(travelIdx)),

    onMutate: async ({ travelIdx, currentlyLiked }) => {
      await queryClient.cancelQueries({ queryKey: travelKeys.past() });
      const prev = queryClient.getQueryData<PastTravelListResponse>(
        travelKeys.past(),
      );
      queryClient.setQueryData<PastTravelListResponse>(
        travelKeys.past(),
        (cur) => setLikedInPast(cur, travelIdx, !currentlyLiked),
      );
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(travelKeys.past(), ctx.prev);
    },

    onSuccess: (data) => {
      queryClient.setQueryData<PastTravelListResponse>(travelKeys.past(), (cur) =>
        setLikedInPast(cur, data.travel_idx, data.liked),
      );
    },
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
