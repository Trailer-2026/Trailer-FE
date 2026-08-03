import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import type { ReelsMediaAsset } from "@/src/features/reels/types";
import { getBgmTracks, getRenderStatus, renderPhotosOnly } from "./api";
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
 * 렌더 시작. 성공 시 반환된 reels_idx 로 진행률 화면으로 이동한다(호출부).
 */
export function useRenderPhotosOnly() {
  return useMutation({
    mutationFn: ({
      photos,
      options,
    }: {
      photos: ReelsMediaAsset[];
      options: RenderOptions;
    }) => renderPhotosOnly(photos, options),
  });
}
