import { create } from "zustand";

import type { LatLng } from "./geo";
import type { ScenicNearbyResponse } from "./types";

/**
 * 탑승 세션 — 사용자가 "탑승 시작"을 누른 열차 구간 1개.
 * 이번 범위에서는 동시에 1개 구간만 다룬다(경유 자동 전환 없음).
 */
export type ScenicSession = {
  travelIdx: number;
  /** 어떤 train 일정 항목인지 — 같은 여행에 구간이 여러 개일 때 구분용 */
  scheduleIdx: number;
  fromStation: string;
  toStation: string;
  /** "KTX 101" 처럼 화면에 표시할 열차 이름 */
  label: string;
  /** 탑승 시작 시각(epoch ms) */
  startedAt: number;
};

type ScenicState = {
  session: ScenicSession | null;
  /**
   * **마지막으로 API 를 실제 호출한 지점**의 좌표. 폴링 때마다 갱신하지 않는다.
   * (스킵할 때도 갱신하면 조금씩 움직이는 동안 기준점이 따라와 영영 임계값을
   *  못 넘긴다. 호출 시점만 기록해야 누적 이동이 정상 판정된다.)
   */
  lastPosition: LatLng | null;
  /** 마지막 실제 호출 시각(epoch ms). 화면 재진입 시 중복 호출을 막는 기준. */
  lastCalledAt: number | null;
  lastResponse: ScenicNearbyResponse | null;
  /** 직전 응답의 관광지 이름들 — 같은 곳만 반복되는지 판단용 */
  lastItemNames: string[];
  /** 마지막 갱신에서 새로 등장한 관광지가 있었는지(반복이면 false → 강조 안 함) */
  hasNewSpots: boolean;
};

type ScenicActions = {
  startRiding: (
    session: Omit<ScenicSession, "startedAt"> & { startedAt?: number },
  ) => void;
  stopRiding: () => void;
  /** 실제 API 호출에 성공했을 때의 좌표·시각 기록 */
  markCalled: (position: LatLng, at: number) => void;
  setResult: (res: ScenicNearbyResponse) => void;
};

const initialState: ScenicState = {
  session: null,
  lastPosition: null,
  lastCalledAt: null,
  lastResponse: null,
  lastItemNames: [],
  hasNewSpots: false,
};

/**
 * 탑승 세션 스토어.
 *
 * 지금은 메모리 유지(앱 재시작 시 세션 사라짐). 앱을 껐다 켜도 유지하려면
 * 이 create 를 zustand/middleware 의 persist 로 감싸기만 하면 되도록,
 * 상태를 전부 직렬화 가능한 값(원시값·평범한 객체)으로만 두었다.
 */
export const useScenicStore = create<ScenicState & ScenicActions>((set, get) => ({
  ...initialState,

  startRiding: (session) =>
    set({
      // 세션 시작 시 직전 구간의 위치·결과가 남지 않도록 전부 초기화한다.
      ...initialState,
      session: { ...session, startedAt: session.startedAt ?? Date.now() },
    }),

  stopRiding: () => set(initialState),

  markCalled: (position, at) => set({ lastPosition: position, lastCalledAt: at }),

  setResult: (res) => {
    const prevNames = get().lastItemNames;
    const names = res.items.map((i) => i.name);
    set({
      lastResponse: res,
      lastItemNames: names,
      // 직전에 없던 이름이 하나라도 있으면 "새로 보이는 곳"으로 강조한다.
      hasNewSpots: names.some((n) => !prevNames.includes(n)),
    });
  },
}));

/** 이 여행에서 탑승 중인지. 다른 여행의 세션이면 false. */
export function useIsRiding(travelIdx: number): boolean {
  return useScenicStore((s) => s.session?.travelIdx === travelIdx);
}
