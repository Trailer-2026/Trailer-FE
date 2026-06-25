import { create } from "zustand";

export type PassengerKey = "adult" | "teen" | "child";

export const TRAVEL_STYLES = [
  "#자연힐링",
  "#도시탐방",
  "#액티비티",
  "#문화예술",
] as const;

export type TravelStyle = (typeof TRAVEL_STYLES)[number];

type CourseState = {
  origin: string;
  destination: string;
  roundTrip: boolean;
  departAt: string;
  returnAt: string;
  passengers: Record<PassengerKey, number>;
  styles: TravelStyle[];
};

type CourseActions = {
  setOrigin: (v: string) => void;
  setDestination: (v: string) => void;
  swapOriginDestination: () => void;
  setRoundTrip: (v: boolean) => void;
  setDepartAt: (v: string) => void;
  setReturnAt: (v: string) => void;
  setPassenger: (key: PassengerKey, delta: number) => void;
  toggleStyle: (style: TravelStyle) => void;
  reset: () => void;
};

const initialState: CourseState = {
  origin: "서울",
  destination: "부산",
  roundTrip: true,
  departAt: "2026년 06월 20일(토) 09:00",
  returnAt: "2026년 06월 21일(일) 20:00",
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
  setDepartAt: (v) => set({ departAt: v }),
  setReturnAt: (v) => set({ returnAt: v }),

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
