import { create } from "zustand";

import type { StationResponse } from "@/src/features/station/types";

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
