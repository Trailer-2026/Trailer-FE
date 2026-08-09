import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { notificationKeys } from "../notification/keys";

import {
  createManualTravel,
  createSchedule,
  createTravel,
  deleteSchedule,
  deleteTravel,
  getCurrentTravel,
  getPastTravels,
  getTravelDetail,
  getTravelTickets,
  likeTravel,
  unlikeTravel,
  updateSchedule,
  updateTravelTitle,
} from "./api";
import { travelKeys } from "./keys";
import type {
  PastTravelListResponse,
  ScheduleCreateRequest,
  ScheduleUpdateRequest,
  TravelManualCreateRequest,
} from "./types";

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
 * 여행 1건 일정표 상세 조회.
 * - travelIdx 가 없으면 비활성(enabled:false) — 예정된 여행이 없을 때 등.
 * - 404/401 은 호출부(TravelDetailView)에서 isAxiosError status 로 분기.
 */
export function useTravelDetail(travelIdx?: number) {
  return useQuery({
    queryKey: travelKeys.detail(travelIdx ?? -1),
    queryFn: () => getTravelDetail(travelIdx!),
    enabled: travelIdx != null,
    staleTime: 1000 * 60, // 1분
  });
}

/**
 * 여행 상세(일정표)를 미리 캐시에 받아둔다.
 * - 예정된 여행 탭 진입 시 호출해두면, 상세 화면의 useTravelDetail 이 같은 키
 *   (travelKeys.detail)의 캐시를 재사용해 로딩 없이 즉시 렌더된다.
 * - travelIdx 가 없으면 아무것도 안 한다. 이미 fresh 한 캐시가 있으면 재요청도 생략.
 */
export function usePrefetchTravelDetail(travelIdx?: number) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (travelIdx == null) return;
    queryClient.prefetchQuery({
      queryKey: travelKeys.detail(travelIdx),
      queryFn: () => getTravelDetail(travelIdx),
      staleTime: 1000 * 60, // 1분 — useTravelDetail 과 동일
    });
  }, [queryClient, travelIdx]);
}

/**
 * 여행의 승차권 목록.
 * - travelIdx 가 없으면 비활성.
 * - '직접 만들기' 여행은 서버가 404 를 주는데, api 층에서 상세로 폴백하므로
 *   호출부는 신경 쓸 필요 없다.
 */
export function useTravelTickets(travelIdx?: number) {
  return useQuery({
    queryKey: travelKeys.tickets(travelIdx ?? -1),
    queryFn: () => getTravelTickets(travelIdx!),
    enabled: travelIdx != null,
    staleTime: 1000 * 60, // 1분
  });
}

/**
 * 일정 항목 추가/편집/삭제 성공 시 해당 여행의 캐시를 함께 무효화한다.
 * 기차 항목은 승차권 화면에도 그대로 나오므로 detail 과 tickets 를 같이 비운다.
 */
function invalidateTravelCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  travelIdx: number,
) {
  queryClient.invalidateQueries({ queryKey: travelKeys.detail(travelIdx) });
  queryClient.invalidateQueries({ queryKey: travelKeys.tickets(travelIdx) });
}

export function useCreateSchedule(travelIdx: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ScheduleCreateRequest) =>
      createSchedule(travelIdx, body),
    onSuccess: () => invalidateTravelCaches(queryClient, travelIdx),
  });
}

export function useUpdateSchedule(travelIdx: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleIdx,
      body,
    }: {
      scheduleIdx: number;
      body: ScheduleUpdateRequest;
    }) => updateSchedule(travelIdx, scheduleIdx, body),
    onSuccess: () => invalidateTravelCaches(queryClient, travelIdx),
  });
}

export function useDeleteSchedule(travelIdx: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scheduleIdx: number) =>
      deleteSchedule(travelIdx, scheduleIdx),
    onSuccess: () => invalidateTravelCaches(queryClient, travelIdx),
  });
}

/**
 * "이 일정 선택하기" 저장.
 * - 성공 시 travels/current 를 invalidate 하여 홈 카드가 자동 갱신되게 한다.
 * - 서버가 알림 로그에도 이벤트를 남기므로 알림 목록 캐시도 함께 무효화.
 * - 400 만료 에러는 호출부에서 axios status 로 분기.
 */
export function useCreateTravel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => createTravel(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: travelKeys.current() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}

/**
 * "직접 일정 만들기" — 빈 여행 1건 생성(POST /api/travels/manual).
 * - 예정 여행은 1개만 가능해서 이미 있으면 400. 호출부에서 message 그대로 안내한다.
 * - 성공 시 current 를 invalidate 해 일정 탭 카드가 바로 갱신되게 한다.
 *   (추천 저장과 달리 알림 로그 이벤트는 없으므로 알림 캐시는 건드리지 않는다.)
 */
export function useCreateManualTravel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TravelManualCreateRequest) => createManualTravel(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: travelKeys.current() });
    },
  });
}

/**
 * 여행 제목 변경.
 * - title 을 빈 문자열/공백으로 보내면 서버가 지역·기간으로 자동 생성한다.
 * - 성공 시 응답의 travel_idx 로 detail 캐시와 current/past 목록을 함께 무효화해
 *   상세·요약 어디서든 새 제목이 반영되게 한다.
 */
export function useUpdateTravelTitle(travelIdx: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => updateTravelTitle(travelIdx, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: travelKeys.current() });
      queryClient.invalidateQueries({ queryKey: travelKeys.past() });
      queryClient.invalidateQueries({ queryKey: travelKeys.detail(travelIdx) });
    },
  });
}

/**
 * 여행 소프트 삭제.
 * - 삭제된 여행의 detail 캐시는 아예 제거(다시 불러도 404 라 keep 하는 의미가 없다).
 * - current/past 목록과 알림 목록(서버가 '여행 삭제' 로그를 남김) 을 무효화.
 */
export function useDeleteTravel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (travelIdx: number) => deleteTravel(travelIdx),
    onSuccess: (_data, travelIdx) => {
      queryClient.removeQueries({ queryKey: travelKeys.detail(travelIdx) });
      queryClient.invalidateQueries({ queryKey: travelKeys.current() });
      queryClient.invalidateQueries({ queryKey: travelKeys.past() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}
