import { create } from "zustand";

/**
 * 탑승 세션 — 사용자가 타고 있는 열차 구간 1개.
 * 이번 범위에서는 동시에 1개 구간만 다룬다(경유 자동 전환 없음).
 *
 * 세션은 **화면용**이다. 어느 구간의 풍경 시각표를 일정표에 끼울지, 언제 GPS 보정을
 * 보낼지 정하는 기준일 뿐 알림 발송과는 무관하다 — 풍경 푸시는 서버가 열차 시간표로
 * 직접 보내므로 세션이 없어도(앱이 꺼져 있어도) 온다.
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
   * 사용자가 직접 '알림 끄기'를 누른 구간의 scheduleIdx.
   * 자동 탑승(AutoBoarding)이 도착 시각 전이라는 이유로 곧바로 다시 켜버리면
   * 종료 버튼이 무의미해지므로, 이 구간만 자동 시작에서 제외한다.
   */
  skipAutoScheduleIdx: number | null;
};

type ScenicActions = {
  startRiding: (
    session: Omit<ScenicSession, "startedAt"> & { startedAt?: number },
  ) => void;
  /**
   * 탑승 종료. 사용자가 직접 누른 종료면 `{ skipAuto: true }` 로 불러
   * 그 구간이 자동으로 다시 켜지지 않게 한다(자동 종료는 옵션 없이 호출).
   */
  stopRiding: (options?: { skipAuto?: boolean }) => void;
};

const initialState: ScenicState = {
  session: null,
  skipAutoScheduleIdx: null,
};

/**
 * 탑승 세션 스토어.
 *
 * 시각표·지연·조회 상태는 여기 두지 않는다 — react-query 캐시(queries.ts 의
 * useScenicPlanQuery)가 들고 있고, 화면은 그쪽을 구독한다.
 *
 * 지금은 메모리 유지(앱 재시작 시 세션 사라짐). 앱을 껐다 켜도 유지하려면
 * 이 create 를 zustand/middleware 의 persist 로 감싸기만 하면 되도록,
 * 상태를 전부 직렬화 가능한 값(원시값·평범한 객체)으로만 두었다.
 */
export const useScenicStore = create<ScenicState & ScenicActions>((set, get) => ({
  ...initialState,

  startRiding: (session) =>
    set({
      ...initialState,
      session: { ...session, startedAt: session.startedAt ?? Date.now() },
    }),

  stopRiding: (options) =>
    set({
      ...initialState,
      skipAutoScheduleIdx: options?.skipAuto
        ? get().session?.scheduleIdx ?? null
        : null,
    }),
}));

/** 이 여행에서 탑승 중인지. 다른 여행의 세션이면 false. */
export function useIsRiding(travelIdx: number): boolean {
  return useScenicStore((s) => s.session?.travelIdx === travelIdx);
}
