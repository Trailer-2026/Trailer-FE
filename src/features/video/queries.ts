import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import type { ReelsMediaAsset } from "@/src/features/reels/types";
import { getRenderStatus, renderPhotosOnly } from "./api";
import { videoKeys } from "./keys";
import type { RenderOptions } from "./types";

/** 폴링 중 job_id 를 찾지 못하는(서버 재시작 등) 상황인지. */
export function isJobNotFound(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

const POLL_INTERVAL_MS = 2500;

/**
 * 렌더 진행률 폴링.
 * - job_id 가 없으면 비활성(enabled:false).
 * - status 가 done|failed 면 폴링 중지(refetchInterval=false).
 * - 404(job 없음)는 재시도하지 않고 바로 에러로 노출 → 화면에서 안내(isJobNotFound).
 */
export function useRenderStatus(jobId: string | null) {
  return useQuery({
    queryKey: videoKeys.status(jobId ?? ""),
    queryFn: () => getRenderStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "done" || status === "failed") return false;
      // 존재하지 않는 job(404)은 계속 물어봐도 소용없으니 폴링 중단.
      if (isJobNotFound(query.state.error)) return false;
      return POLL_INTERVAL_MS;
    },
    retry: (failureCount, error) => {
      if (isJobNotFound(error)) return false; // 존재하지 않는 job → 즉시 표면화
      return failureCount < 1;
    },
  });
}

/**
 * 렌더 시작. 성공 시 반환된 job_id 로 진행률 화면으로 이동한다(호출부).
 * useQuery(useRenderStatus)와 분리해, 좌표 입력 렌더가 붙어도 폴링은 그대로 재사용한다.
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
