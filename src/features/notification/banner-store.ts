import { create } from "zustand";

import type { NotificationTarget } from "./routing";

/**
 * 포그라운드 푸시를 보여주는 상단 인앱 배너 상태.
 *
 * 안드로이드는 앱이 화면에 떠 있을 때 시스템 알림을 띄우지 않는다. 그래서 FCM
 * onMessage 로 받은 내용을 앱이 직접 그려야 사용자가 볼 수 있다 — 풍경 알림처럼
 * "지금 창밖을 보라"는 시간 민감 알림은 특히 그렇다. 렌더 완료 배너(video/RenderTracker)
 * 와 같은 자리·같은 모양을 쓴다.
 *
 * 한 번에 하나만 보여준다. 새 알림이 오면 이전 것을 덮는다(큐 없음).
 */
export type PushBanner = {
  /** 같은 내용이 연달아 와도 새 배너로 취급하기 위한 일련번호 */
  id: number;
  title: string;
  body: string;
  /** 탭했을 때의 이동 규칙(routing.ts). 알림함·푸시 탭과 같은 규칙을 쓴다. */
  target: NotificationTarget;
};

/** 자동으로 사라지기까지의 시간. 풍경 알림은 문구가 짧아 이 정도면 읽는다. */
const AUTO_DISMISS_MS = 6000;

type BannerState = {
  banner: PushBanner | null;
  show: (banner: Omit<PushBanner, "id">) => void;
  dismiss: () => void;
};

let seq = 0;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export const usePushBannerStore = create<BannerState>((set) => ({
  banner: null,

  show: (banner) => {
    if (dismissTimer) clearTimeout(dismissTimer);
    seq += 1;
    set({ banner: { ...banner, id: seq } });
    dismissTimer = setTimeout(() => {
      dismissTimer = null;
      set({ banner: null });
    }, AUTO_DISMISS_MS);
  },

  dismiss: () => {
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
    set({ banner: null });
  },
}));

/** 컴포넌트 밖(FCM 핸들러)에서 배너를 띄운다. */
export function showPushBanner(banner: Omit<PushBanner, "id">): void {
  usePushBannerStore.getState().show(banner);
}
