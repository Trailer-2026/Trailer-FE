import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import type { VideoRenderStatusResponse } from "./types";

/**
 * 진행 중인 렌더(릴스)를 앱 전역에서 추적하는 스토어.
 *
 * 렌더는 수 분 걸리므로 사용자가 진행률 화면을 떠나도 되게 한다. reels_idx 를
 * secure-store 에 저장해 앱을 나갔다/재실행해도 이어서 확인한다(앱이 켜져 있거나
 * 다시 켜질 때 폴링으로 완료를 감지 → 인앱 배너).
 */

// (구버전 job_id 키와 다른 새 키 — 예전에 저장된 잘못된 값과 섞이지 않는다)
const KEY = "active_render_reels_idx";

export type RenderBanner = {
  reelsIdx: number;
  status: "done" | "failed";
  /** 완료 시 재생 URL(있으면) */
  videoUrl: string | null;
  /** 실패 사유 */
  error: string | null;
};

type State = {
  /** 추적 중인 릴스 reels_idx (secure-store 에 문자열로 저장). */
  reelsIdx: number | null;
  hydrated: boolean;
  /** 사용자가 지금 진행률 화면을 보고 있는지 — 보고 있으면 배너를 띄우지 않는다. */
  onProgressScreen: boolean;
  banner: RenderBanner | null;
  /** 이미 배너로 알린 reels_idx — 중복 알림 방지. */
  notifiedReelsIdx: number | null;

  hydrate: () => Promise<void>;
  start: (reelsIdx: number) => void;
  setOnProgressScreen: (value: boolean) => void;
  /** 폴링이 done|failed|unknown 을 감지하면 호출 — 화면 밖일 때만 배너를 띄운다. */
  notify: (result: VideoRenderStatusResponse) => void;
  acknowledge: () => void;
};

export const useActiveRenderStore = create<State>((set, get) => ({
  reelsIdx: null,
  hydrated: false,
  onProgressScreen: false,
  banner: null,
  notifiedReelsIdx: null,

  hydrate: async () => {
    try {
      const saved = await SecureStore.getItemAsync(KEY);
      const n = saved != null ? Number(saved) : NaN;
      set({ reelsIdx: Number.isFinite(n) ? n : null, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  start: (reelsIdx) => {
    set({ reelsIdx, banner: null, notifiedReelsIdx: null });
    void SecureStore.setItemAsync(KEY, String(reelsIdx));
  },

  setOnProgressScreen: (value) => set({ onProgressScreen: value }),

  notify: (result) => {
    const { notifiedReelsIdx, onProgressScreen } = get();
    if (notifiedReelsIdx === result.reels_idx) return; // 이미 알림
    set({
      notifiedReelsIdx: result.reels_idx,
      banner: onProgressScreen
        ? null
        : {
            reelsIdx: result.reels_idx,
            status: result.status === "done" ? "done" : "failed",
            videoUrl: result.video_url ?? result.reels_url,
            error: result.error,
          },
    });
  },

  acknowledge: () => {
    set({ banner: null, reelsIdx: null, notifiedReelsIdx: null });
    void SecureStore.deleteItemAsync(KEY);
  },
}));
