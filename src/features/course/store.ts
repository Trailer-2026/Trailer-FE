import { create } from "zustand";

import type { StationResponse } from "@/src/features/station/types";

import type { RecommendCriteria, Theme } from "./types";

export type PassengerKey = "adult" | "teen" | "child";

/** course 스토어에서 다루는 역 선택값. 미선택 상태를 표현하기 위해 null 을 허용한다. */
export type SelectedStation = Pick<StationResponse, "station_idx" | "station_name">;

export const TRAVEL_STYLES = [
  "#자연힐링",
  "#도시탐방",
  "#액티비티",
  "#문화예술",
] as const;

export type TravelStyle = (typeof TRAVEL_STYLES)[number];

/**
 * UI 태그 → 서버 Theme enum 매핑.
 * 서버 enum: NATURE/OCEAN/HISTORY/CITY/HEALING/FOOD/CULTURE/THEME_PARK
 * TODO(design): 액티비티 태그는 확정된 enum 이 없어 임시로 THEME_PARK 로 보냄. 기획 확정 시 조정.
 */
export function mapStyleToTheme(style: TravelStyle): Theme {
  switch (style) {
    case "#자연힐링":
      return "HEALING";
    case "#도시탐방":
      return "CITY";
    case "#문화예술":
      return "CULTURE";
    case "#액티비티":
      return "THEME_PARK";
  }
}

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
  roundTrip: boolean;
  departDate: Date;
  returnDate: Date;
  passengers: Record<PassengerKey, number>;
  styles: TravelStyle[];
};

type CourseActions = {
  setOrigin: (v: SelectedStation | null) => void;
  setDestination: (v: SelectedStation | null) => void;
  swapOriginDestination: () => void;
  setRoundTrip: (v: boolean) => void;
  setDepartDate: (v: Date) => void;
  setReturnDate: (v: Date) => void;
  setPassenger: (key: PassengerKey, delta: number) => void;
  toggleStyle: (style: TravelStyle) => void;
  reset: () => void;
};

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

const initialState: CourseState = {
  origin: null,
  destination: null,
  roundTrip: true,
  departDate: today,
  returnDate: tomorrow,
  passengers: { adult: 1, teen: 0, child: 0 },
  styles: [],
};

export const useCourseStore = create<CourseState & CourseActions>((set) => ({
  ...initialState,

  setOrigin: (v) => set({ origin: v }),
  setDestination: (v) => set({ destination: v }),

  swapOriginDestination: () =>
    set((s) => ({ origin: s.destination, destination: s.origin })),

  setRoundTrip: (v) => set({ roundTrip: v }),
  setDepartDate: (v) => set({ departDate: v }),
  setReturnDate: (v) => set({ returnDate: v }),

  setPassenger: (key, delta) =>
    set((s) => {
      const next = Math.max(key === "adult" ? 1 : 0, s.passengers[key] + delta);
      return { passengers: { ...s.passengers, [key]: next } };
    }),

  toggleStyle: (style) =>
    set((s) => ({
      styles: s.styles.includes(style)
        ? s.styles.filter((x) => x !== style)
        : [...s.styles, style],
    })),

  reset: () => set(initialState),
}));

/**
 * 현재 store 상태 → 서버 요청 바디로 조립.
 * - 출발지 미선택 상태에서 호출하면 throw. UI 단계에서 검증하고 부를 것.
 * - 도착지 미선택 시 dest_station_idx = null (AI 자동추천).
 * - 왕복=false 여도 서버 스키마상 back_date 는 필수라 depart 로 채움.
 * - go_time / back_time / max_travel_minutes / via_station_idx 는 아직 UI 미노출 → null.
 */
export function buildRecommendCriteria(
  state: Pick<
    CourseState,
    "origin" | "destination" | "roundTrip" | "departDate" | "returnDate" | "passengers" | "styles"
  >,
  page: number,
): RecommendCriteria {
  if (!state.origin) {
    throw new Error("출발지가 선택되지 않았습니다.");
  }
  return {
    origin_station_idx: state.origin.station_idx,
    dest_station_idx: state.destination?.station_idx ?? null,
    round_trip: state.roundTrip,
    go_date: toYyyymmdd(state.departDate),
    go_time: null,
    back_date: toYyyymmdd(state.roundTrip ? state.returnDate : state.departDate),
    back_time: null,
    party: {
      adult: state.passengers.adult,
      youth: state.passengers.teen,
      child: state.passengers.child,
    },
    themes: state.styles.map(mapStyleToTheme),
    max_travel_minutes: null,
    via_station_idx: null,
    use_naeilpass: false,
    page,
  };
}
