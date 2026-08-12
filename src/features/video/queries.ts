import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { reelsKeys } from "@/src/features/reels/keys";
import type { ReelsMediaAsset } from "@/src/features/reels/types";
import { userKeys } from "@/src/features/user/keys";
import {
  cutVideoSection,
  getBgmTracks,
  getRenderStatus,
  insertImageClip,
  renderPhotosOrdered,
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
    staleTime: 1000 * 60 * 30, // 30분
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.myReels() });
      queryClient.invalidateQueries({ queryKey: reelsKeys.all });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.myReels() });
      queryClient.invalidateQueries({ queryKey: reelsKeys.all });
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
