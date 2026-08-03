import { create } from "zustand";

import { SAMPLE_TRIP, type Trip } from "./data";

export type ScheduleTab = "ticket" | "schedule";

type ScheduleState = {
  trip: Trip | null; // 내 일정에 추가된 여행 (없으면 빈 상태)
  initialTab: ScheduleTab; // 내 일정 진입 시 기본으로 열 서브탭
};

type ScheduleActions = {
  /** 일정 만들기 결과 → "일정표에 추가하기" 시 호출 */
  addTrip: () => void;
  clear: () => void;
};

const initialState: ScheduleState = {
  trip: null,
  initialTab: "schedule",
};

export const useScheduleStore = create<ScheduleState & ScheduleActions>(
  (set) => ({
    ...initialState,

    addTrip: () => set({ trip: SAMPLE_TRIP, initialTab: "schedule" }),
    clear: () => set(initialState),
  }),
);
