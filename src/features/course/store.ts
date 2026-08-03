import { create } from "zustand";

import type { StationResponse } from "@/src/features/station/types";

import { addDays } from "./date";
import type { RecommendCriteria, Theme } from "./types";

export type PassengerKey = "adult" | "teen" | "child";

/** course 스토어에서 다루는 역 선택값. 미선택 상태를 표현하기 위해 null 을 허용한다. */
export type SelectedStation = Pick<StationResponse, "station_idx" | "station_name">;

/**
 * 여행스타일 픽커에서 보여줄 카드 목록.
 * label 은 UI 표기, theme 는 그대로 서버에 보낼 enum 값.
 * 서버 enum: NATURE/OCEAN/HISTORY/CITY/HEALING/FOOD/CULTURE/THEME_PARK
 */
export const TRAVEL_STYLES: readonly { theme: Theme; label: string }[] = [
  { theme: "NATURE", label: "산 · 자연" },
  { theme: "OCEAN", label: "바다 · 해안" },
  { theme: "HISTORY", label: "역사 · 유적" },
  { theme: "CITY", label: "도시 · 쇼핑" },
  { theme: "HEALING", label: "힐링 · 온천" },
  { theme: "FOOD", label: "맛집 탐방" },
  { theme: "CULTURE", label: "문화 · 예술" },
  { theme: "THEME_PARK", label: "테마파크" },
];

/** Date → "YYYYMMDD". 서버 go_date / back_date 포맷. */
export function toYyyymmdd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

type CourseState = {
  origin: SelectedStation | null;
  destination: SelectedStation | null;
  viaStation: SelectedStation | null;
  departDate: Date;
  /** 여행 숙박 수. 당일치기=0, 1박2일=1 … 도착일 = departDate + nights. 미선택 시 null. */
  nights: number | null;
  passengers: Record<PassengerKey, number>;
  styles: Theme[];
};

type CourseActions = {
  setOrigin: (v: SelectedStation | null) => void;
  setDestination: (v: SelectedStation | null) => void;
  setViaStation: (v: SelectedStation | null) => void;
  setDepartDate: (v: Date) => void;
  setNights: (v: number) => void;
  setPassenger: (key: PassengerKey, delta: number) => void;
  toggleStyle: (theme: Theme) => void;
  reset: () => void;
};

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const initialState: CourseState = {
  origin: null,
  destination: null,
  viaStation: null,
  departDate: today,
  nights: null,
  passengers: { adult: 0, teen: 0, child: 0 },
  styles: [],
};

export const useCourseStore = create<CourseState & CourseActions>((set) => ({
  ...initialState,

  setOrigin: (v) => set({ origin: v }),
  setDestination: (v) => set({ destination: v }),
  setViaStation: (v) => set({ viaStation: v }),
  setDepartDate: (v) => set({ departDate: v }),
  setNights: (v) => set({ nights: v }),

  setPassenger: (key, delta) =>
    set((s) => {
      const next = Math.max(0, s.passengers[key] + delta);
      return { passengers: { ...s.passengers, [key]: next } };
    }),

  toggleStyle: (theme) =>
    set((s) => ({
      styles: s.styles.includes(theme)
        ? s.styles.filter((x) => x !== theme)
        : [...s.styles, theme],
    })),

  reset: () => set(initialState),
}));

/**
 * 현재 store 상태 → 서버 요청 바디로 조립.
 * - 출발지 미선택 상태에서 호출하면 throw. UI 단계에서 검증하고 부를 것.
 * - 도착지 미선택 시 dest_station_idx = null (AI 자동추천).
 * - 도착일(back_date) = 출발일 + nights (당일치기=0). nights 미선택 시 0(당일) 취급.
 * - round_trip 은 항상 true(가서 여행 후 돌아오는 왕복 일정).
 * - go_time / back_time / max_travel_minutes 는 아직 UI 미노출 → null.
 */
export function buildRecommendCriteria(
  state: Pick<
    CourseState,
    "origin" | "destination" | "viaStation" | "departDate" | "nights" | "passengers" | "styles"
  >,
  page: number,
): RecommendCriteria {
  if (!state.origin) {
    throw new Error("출발지가 선택되지 않았습니다.");
  }
  const nights = state.nights ?? 0;
  return {
    origin_station_idx: state.origin.station_idx,
    dest_station_idx: state.destination?.station_idx ?? null,
    round_trip: true,
    go_date: toYyyymmdd(state.departDate),
    go_time: null,
    back_date: toYyyymmdd(addDays(state.departDate, nights)),
    back_time: null,
    party: {
      adult: state.passengers.adult,
      youth: state.passengers.teen,
      child: state.passengers.child,
    },
    themes: state.styles,
    max_travel_minutes: null,
    via_station_idx: state.viaStation?.station_idx ?? null,
    use_naeilpass: false,
    page,
  };
}
