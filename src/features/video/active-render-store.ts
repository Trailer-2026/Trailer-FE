import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import type { VideoRenderStatusResponse } from "./types";

/**
 * 진행 중인 렌더 job 을 앱 전역에서 추적하는 스토어.
 *
 * 렌더는 4~10분 걸리므로 사용자가 진행률 화면을 떠나 다른 화면을 봐도 되게 한다.
 * job_id 를 secure-store 에 저장해 앱을 나갔다/재실행해도 이어서 확인한다(백엔드 푸시 없이,
 * 앱이 켜져 있거나 다시 켜질 때 폴링으로 완료를 감지 → 인앱 배너).
 */

const KEY = "active_render_job_id";

export type RenderBanner = {
  jobId: string;
  status: "done" | "failed";
  /** 완료 시 재생 URL(있으면) */
  videoUrl: string | null;
  /** 실패 시 사유 */
  error: string | null;
};

type State = {
  /** 추적 중인 렌더 job_id (secure-store 에 저장). */
  jobId: string | null;
  /** secure-store 복구 완료 여부. */
  hydrated: boolean;
  /** 사용자가 지금 진행률 화면을 보고 있는지 — 보고 있으면 배너를 띄우지 않는다. */
  onProgressScreen: boolean;
  /** 완료/실패 배너(메모리 전용). null 이면 배너 없음. */
  banner: RenderBanner | null;
  /** 이미 배너로 알린 job_id — 중복 알림 방지(메모리 전용). */
  notifiedJobId: string | null;

  hydrate: () => Promise<void>;
  /** 렌더 시작 시 추적 개시. */
  start: (jobId: string) => void;
  setOnProgressScreen: (value: boolean) => void;
  /** 폴링이 done|failed 를 감지하면 호출 — 화면 밖일 때만 배너를 띄운다. */
  notify: (result: VideoRenderStatusResponse) => void;
  /** 결과 확인/닫기 → 추적 종료(저장 삭제). */
  acknowledge: () => void;
};

export const useActiveRenderStore = create<State>((set, get) => ({
  jobId: null,
  hydrated: false,
  onProgressScreen: false,
  banner: null,
  notifiedJobId: null,

  hydrate: async () => {
    try {
      const saved = await SecureStore.getItemAsync(KEY);
      set({ jobId: saved ?? null, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  start: (jobId) => {
    set({ jobId, banner: null, notifiedJobId: null });
    void SecureStore.setItemAsync(KEY, jobId);
  },

  setOnProgressScreen: (value) => set({ onProgressScreen: value }),

  notify: (result) => {
    const { notifiedJobId, onProgressScreen } = get();
    if (notifiedJobId === result.job_id) return; // 이미 이 job 을 알림
    set({
      notifiedJobId: result.job_id,
      // 진행률 화면을 보고 있으면 그 화면이 결과를 직접 보여주므로 배너 생략.
      banner: onProgressScreen
        ? null
        : {
            jobId: result.job_id,
            status: result.status === "failed" ? "failed" : "done",
            videoUrl: result.video_url ?? result.reels_url,
            error: result.error,
          },
    });
  },

  acknowledge: () => {
    set({ banner: null, jobId: null, notifiedJobId: null });
    void SecureStore.deleteItemAsync(KEY);
  },
}));
