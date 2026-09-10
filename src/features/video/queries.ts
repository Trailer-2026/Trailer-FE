import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { CACHE_POLICY } from "@/src/api/cache-policy";
import { reelsKeys } from "@/src/features/reels/keys";
import type { ReelsMediaAsset } from "@/src/features/reels/types";
import { userKeys } from "@/src/features/user/keys";
import {
  cutVideoSection,
  deleteReels,
  getBgmTracks,
  getReelsVideoUrl,
  getRenderStatus,
  insertImageClip,
  renderPhotosOrdered,
  renderTravelVideo,
  updateReelsTitle,
  uploadReelsVideo,
} from "./api";
import { videoKeys } from "./keys";
import type { RenderOptions } from "./types";

/** BGM 트랙 목록. 거의 안 바뀌므로 길게 캐시한다. */
export function useBgmTracks() {
  return useQuery({
    queryKey: videoKeys.bgm(),
    queryFn: getBgmTracks,
    ...CACHE_POLICY.STATIC,
  });
}

/**
 * 릴스가 생기거나 바뀌거나 지워졌을 때 무효화할 목록들.
 *
 * - 내 릴스 목록: `exact` 를 붙여야 한다 — myReels 키가 likedReels 키의 접두사라
 *   그냥 넘기면 좋아요 목록까지 같이 다시 받는다.
 * - 추천: recommend() 접두사로 피드와 홈 카드만 걸린다(댓글 캐시는 그대로).
 */
function invalidateMyReelsLists(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: userKeys.myReels(), exact: true });
  queryClient.invalidateQueries({ queryKey: reelsKeys.recommend() });
}

/**
 * 편집 화면이 열 릴스의 재생 주소 + 소유 여부.
 *
 * 편집은 되돌릴 수 없으므로 캐시된 값을 재사용하지 않는다(staleTime 0) —
 * 소유 판정이 낡은 채로 편집 화면이 열리면 안 된다. 404(없음/렌더 미완료)는
 * 재시도 없이 바로 화면에 노출한다.
 */
export function useReelsVideoUrl(reelsIdx: number | null) {
  return useQuery({
    queryKey: videoKeys.reelsUrl(reelsIdx ?? -1),
    queryFn: () => getReelsVideoUrl(reelsIdx!),
    enabled: reelsIdx != null,
    staleTime: 0,
    retry: (failureCount, error) => {
      if (isRenderNotFound(error)) return false;
      return failureCount < 1;
    },
  });
}

/** 폴링 중 릴스를 찾지 못하는(존재하지 않는 reels_idx) 상황인지. */
export function isRenderNotFound(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

const POLL_INTERVAL_MS = 2500;

/**
 * 렌더 진행률 폴링.
 * - reels_idx 가 없으면 비활성(enabled:false).
 * - status 가 done|failed|unknown 이면 폴링 중지(더 진행 안 됨).
 * - 404(릴스 없음)는 재시도하지 않고 바로 에러로 노출 → 화면에서 안내.
 */
export function useRenderStatus(reelsIdx: number | null) {
  return useQuery({
    queryKey: videoKeys.status(reelsIdx ?? -1),
    queryFn: () => getRenderStatus(reelsIdx!),
    enabled: reelsIdx != null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "done" || status === "failed" || status === "unknown") {
        return false;
      }
      if (isRenderNotFound(query.state.error)) return false;
      return POLL_INTERVAL_MS;
    },
    retry: (failureCount, error) => {
      if (isRenderNotFound(error)) return false; // 없는 릴스 → 즉시 표면화
      return failureCount < 1;
    },
  });
}

/**
 * 렌더 시작(사진 순서 지정). 성공 시 반환된 reels_idx 로 진행률 화면으로 이동한다(호출부).
 */
export function useRenderPhotosOrdered() {
  return useMutation({
    mutationFn: ({
      photos,
      options,
    }: {
      photos: ReelsMediaAsset[];
      options: RenderOptions;
    }) => renderPhotosOrdered(photos, options),
  });
}

/**
 * 여행 일정으로 영상 렌더 시작. 사진을 올리지 않아 요청이 가볍다(옵션만 보낸다).
 * 성공하면 reels_idx 를 돌려주므로 호출부가 진행률 화면으로 넘긴다.
 */
export function useRenderTravelVideo() {
  return useMutation({
    mutationFn: ({
      travelIdx,
      options,
    }: {
      travelIdx: number;
      options: RenderOptions;
    }) => renderTravelVideo(travelIdx, options),
  });
}

/**
 * 직접 만든 영상 업로드. 응답 시점에 이미 완성된 릴스라 폴링 없이 목록만 갱신한다.
 * (내 영상 목록 + 릴스 추천·홈 카드)
 */
export function useUploadReelsVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      video: { uri: string; name: string; type: string };
      title?: string;
      /** 0~100 — 호출부가 버튼에 진행률을 그린다. */
      onProgress?: (percent: number) => void;
    }) => uploadReelsVideo(vars.video, vars.title, vars.onProgress),
    onSuccess: () => invalidateMyReelsLists(queryClient),
  });
}

/**
 * 릴스 제목 수정. 영상은 그대로라 목록만 갱신하면 새 제목이 바로 내려온다.
 * (내 영상 목록 + 추천 피드·홈 카드)
 */
export function useUpdateReelsTitle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { reelsIdx: number; title: string | null }) =>
      updateReelsTitle(vars.reelsIdx, vars.title),
    onSuccess: () => invalidateMyReelsLists(queryClient),
  });
}

/**
 * 릴스 삭제. 되돌릴 수 없어 호출부에서 확인을 받고 부른다.
 *
 * 지운 릴스는 내 목록·좋아요 목록·추천 피드 어디에서도 보이면 안 되므로
 * 관련 캐시를 모두 무효화한다.
 */
export function useDeleteReels() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reelsIdx: number) => deleteReels(reelsIdx),
    onSuccess: () => {
      invalidateMyReelsLists(queryClient);
      queryClient.invalidateQueries({ queryKey: userKeys.likedReels() });
    },
  });
}

/**
 * 완성 영상 편집 — 구간 삭제 / 사진 삽입.
 *
 * 서버가 편집 전 영상을 지우므로 되돌리기가 없다(호출부에서 확인을 받는다).
 * 성공하면 새 video_url 을 그대로 화면 상태로 쓴다 — 릴스 PK 는 그대로다.
 */
export function useCutVideoSection() {
  return useMutation({
    mutationFn: (vars: {
      reelsIdx: number;
      startSeconds: number;
      endSeconds: number;
    }) => cutVideoSection(vars.reelsIdx, vars.startSeconds, vars.endSeconds),
  });
}

export function useInsertImageClip() {
  return useMutation({
    mutationFn: (vars: {
      reelsIdx: number;
      atSeconds: number;
      photo: ReelsMediaAsset;
    }) => insertImageClip(vars.reelsIdx, vars.atSeconds, vars.photo),
  });
}
