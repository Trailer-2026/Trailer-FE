import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { notificationKeys } from "../notification/keys";

import type { ReelsMediaAsset } from "@/src/features/reels/types";
import { preparePhotoForUpload } from "@/src/features/video/photo-upload";

import {
  addTravelImages,
  createManualTravel,
  createSchedule,
  createTravel,
  deleteSchedule,
  deleteTravel,
  deleteTravelCoverImage,
  getCurrentTravel,
  getPastTravels,
  getTravelDetail,
  getTravelTickets,
  likeTravel,
  unlikeTravel,
  updateSchedule,
  updateTravelCoverImage,
  updateTravelTitle,
} from "./api";
import { travelKeys } from "./keys";
import type {
  PastTravelCard,
  PastTravelListResponse,
  ScheduleCreateRequest,
  TravelDetail,
  TravelScheduleItem,
  ScheduleUpdateRequest,
  TravelCoverFile,
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
/**
 * ⚠️ 개발용 임시 스위치 — '여행 완료' 상태 화면을 서버 데이터 없이 확인하기 위한 목업.
 *
 * 켜면 진행중 여행이 없는 것처럼(=홈 하단 카드 사라짐), 그 여행이 '다녀온 여행'에
 * 들어간 것처럼 보인다. 서버는 건드리지 않고 화면만 바꾼다.
 * 확인이 끝나면 이 상수를 false 로 되돌릴 것. (__DEV__ 라 릴리스 빌드에는 영향 없음)
 */
const MOCK_TRAVEL_COMPLETED = __DEV__ && false;

/** 목업 여행의 PK. 서버에 없는 값이라 실제 조회는 전부 목업으로 대체한다. */
const MOCK_TRAVEL_IDX = -1;

/** 목업 '다녀온 여행' 1건 — 목록·상세가 같은 값을 쓴다. */
const MOCK_PAST_TRAVEL: PastTravelCard = {
  travel_idx: MOCK_TRAVEL_IDX,
  title: "부산 여행",
  start_date: "2026-08-01",
  end_date: "2026-08-03",
  status: "COMPLETED",
  cover_image_url: null,
  liked: false,
};

/** 목업 여행 상세 — 완료 화면(일정표 + '내 여행 영상 만들기')을 그리는 데 필요한 최소 데이터. */
function mockTravelDetail(): TravelDetail {
  const item = (
    schedule_idx: number,
    sequence: number,
    kind: string,
    title: string,
    start_time: string,
    extra: Partial<TravelScheduleItem> = {},
  ): TravelScheduleItem => ({
    schedule_idx,
    sequence,
    kind,
    title,
    train_no: null,
    train_grade: null,
    dep_station: null,
    arr_station: null,
    car_no: null,
    seat_no: null,
    start_time,
    end_time: null,
    latitude: null,
    longitude: null,
    image_url: null,
    memo: null,
    ...extra,
  });

  return {
    travel_idx: MOCK_TRAVEL_IDX,
    title: MOCK_PAST_TRAVEL.title,
    start_date: MOCK_PAST_TRAVEL.start_date,
    end_date: MOCK_PAST_TRAVEL.end_date,
    region: "부산",
    status: "COMPLETED",
    days: [
      {
        day_no: 1,
        date: MOCK_PAST_TRAVEL.start_date,
        items: [
          item(-101, 1, "train", "KTX 101 서울→부산", "09:00:00", {
            train_no: "101",
            train_grade: "KTX",
            dep_station: "서울",
            arr_station: "부산",
            car_no: "3",
            seat_no: "12A",
            end_time: "11:40:00",
          }),
          item(-102, 2, "visit", "감천문화마을", "13:00:00", {
            latitude: 35.0975,
            longitude: 129.0107,
          }),
        ],
      },
      {
        day_no: 2,
        date: "2026-08-02",
        items: [
          item(-103, 1, "visit", "해운대 해수욕장", "10:00:00", {
            latitude: 35.1587,
            longitude: 129.1604,
          }),
        ],
      },
    ],
  };
}

export function useCurrentTravel() {
  const query = useQuery({
    queryKey: travelKeys.current(),
    queryFn: getCurrentTravel,
    // 목업 모드에선 응답을 어차피 버리므로 요청 자체를 보내지 않는다(로그인 전 401 소음 방지).
    enabled: !MOCK_TRAVEL_COMPLETED,
    staleTime: 1000 * 60, // 1분
  });
  // 여행이 끝나면 서버가 data=null 을 주므로, 목업도 null 로 맞춘다.
  if (MOCK_TRAVEL_COMPLETED) return { ...query, data: null };
  return query;
}

/**
 * 지난 여행(종료된 여행) 목록 조회. 여행 조회 화면 진입 시 자동 실행.
 * 없으면 travels=[] 로 온다.
 */
export function usePastTravels() {
  const query = useQuery({
    queryKey: travelKeys.past(),
    queryFn: getPastTravels,
    // 목업 모드에선 서버를 보지 않는다 — 목록을 목업으로 통째 대체하므로 요청이 무의미하다.
    enabled: !MOCK_TRAVEL_COMPLETED,
    staleTime: 1000 * 60, // 1분
  });

  // 목업: '다녀온 여행' 을 완료된 여행 1건으로 대체한다.
  // 상세도 useTravelDetail 이 같은 목업을 돌려주므로 카드를 눌러 완료 화면까지 볼 수 있다.
  if (MOCK_TRAVEL_COMPLETED) {
    const mocked = [MOCK_PAST_TRAVEL];
    return {
      ...query,
      // 서버 조회를 껐으므로(로그인 전이어도) 목업은 항상 보인다.
      isLoading: false,
      isError: false,
      data: { travels: mocked, total: mocked.length },
    };
  }

  return query;
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
  const mocked = MOCK_TRAVEL_COMPLETED && travelIdx === MOCK_TRAVEL_IDX;
  const query = useQuery({
    queryKey: travelKeys.detail(travelIdx ?? -1),
    queryFn: () => getTravelDetail(travelIdx!),
    // 목업 여행은 서버에 없다 — 요청을 보내지 않고 아래에서 목업으로 응답한다.
    enabled: travelIdx != null && !mocked,
    staleTime: 1000 * 60, // 1분
  });
  if (mocked) {
    return {
      ...query,
      isLoading: false,
      isError: false,
      error: null,
      data: mockTravelDetail(),
    };
  }
  return query;
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

/**
 * 여행 대표 사진 지정·변경 / 해제.
 *
 * 썸네일은 목록 카드(current·past)와 일정표 히어로가 모두 쓰므로 세 캐시를 함께 비운다.
 * 삭제도 '없앰'이 아니라 기본 규칙 URL 로 되돌아가는 것이라 갱신이 필요하다.
 */
function invalidateTravelThumbnails(
  queryClient: ReturnType<typeof useQueryClient>,
  travelIdx: number,
) {
  queryClient.invalidateQueries({ queryKey: travelKeys.current() });
  queryClient.invalidateQueries({ queryKey: travelKeys.past() });
  queryClient.invalidateQueries({ queryKey: travelKeys.detail(travelIdx) });
}

// travelIdx 를 훅 인자가 아니라 mutate 변수로 받는다 — 목록에서 어떤 카드의 ⋮ 를
// 눌렀는지가 실행 시점에 정해지고, 시트가 닫히며 선택이 풀려도 안전하다.
export function useUpdateTravelCover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      travelIdx,
      file,
    }: {
      travelIdx: number;
      file: TravelCoverFile;
    }) => updateTravelCoverImage(travelIdx, file),
    onSuccess: (data) => invalidateTravelThumbnails(queryClient, data.travel_idx),
  });
}

export function useDeleteTravelCover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (travelIdx: number) => deleteTravelCoverImage(travelIdx),
    onSuccess: (data) => invalidateTravelThumbnails(queryClient, data.travel_idx),
  });
}

/**
 * 여행 사진 붙이기. 업로드 전 리사이즈·EXIF(GPS·촬영시각) 재주입까지 여기서 한다 —
 * 서버가 EXIF GPS 로 일정에 자동 매핑하므로 좌표가 사라지면 매핑이 안 된다.
 *
 * 성공하면 여행 상세(days[].items[].images / 최상단 images)가 바뀌므로 상세를 무효화한다.
 */
export function useAddTravelImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      travelIdx,
      photos,
      scheduleIdx,
    }: {
      travelIdx: number;
      photos: ReelsMediaAsset[];
      scheduleIdx?: number | null;
    }) => {
      const files = await Promise.all(
        photos.map((photo, index) => preparePhotoForUpload(photo, index)),
      );
      return addTravelImages(travelIdx, files, scheduleIdx);
    },
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({
        queryKey: travelKeys.detail(vars.travelIdx),
      }),
  });
}
