import type { TravelDetail } from "@/src/features/travel/types";

/** 여행 상세에서 뽑아낸 열차 구간 1개 — 탑승 시작의 단위. */
export type TrainSegment = {
  scheduleIdx: number;
  fromStation: string;
  toStation: string;
  /** "KTX 101" 처럼 표시용. 등급·번호가 없으면 "열차" 로 폴백. */
  label: string;
  /** 출발 일시(해당 일차 날짜 + start_time). 시각 정보가 없으면 null. */
  departAt: Date | null;
};

/** "2026-08-06" + "09:30:00" → Date. 둘 중 하나라도 이상하면 null. */
function toDateTime(date: string, time: string | null): Date | null {
  if (!time) return null;
  const d = new Date(`${date}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * 여행 상세 → 탑승 가능한 열차 구간 목록(출발 시각 오름차순).
 * 출발역·도착역이 둘 다 있어야 nearby API 를 부를 수 있으므로 없는 항목은 제외한다.
 */
export function collectTrainSegments(detail: TravelDetail): TrainSegment[] {
  const out: TrainSegment[] = [];
  detail.days.forEach((day) => {
    day.items.forEach((item) => {
      if (item.kind !== "train") return;
      if (!item.dep_station || !item.arr_station) return;
      const label =
        [item.train_grade, item.train_no].filter(Boolean).join(" ") || "열차";
      out.push({
        scheduleIdx: item.schedule_idx,
        fromStation: item.dep_station,
        toStation: item.arr_station,
        label,
        departAt: toDateTime(day.date, item.start_time),
      });
    });
  });

  return out.sort((a, b) => {
    if (!a.departAt && !b.departAt) return 0;
    if (!a.departAt) return 1;
    if (!b.departAt) return -1;
    return a.departAt.getTime() - b.departAt.getTime();
  });
}

/** 출발 시각 배너를 띄우는 창 — 출발 전후 30분. */
export const BOARDING_SUGGEST_WINDOW_MS = 30 * 60 * 1000;

/**
 * 지금이 출발 시각 ±30분인 구간. 여러 개면 가장 가까운 것 1개.
 * 시각 정보가 없는 구간은 제안하지 않는다.
 */
export function findBoardingSuggestion(
  segments: TrainSegment[],
  now: Date,
): TrainSegment | null {
  let best: TrainSegment | null = null;
  let bestGap = Infinity;
  segments.forEach((seg) => {
    if (!seg.departAt) return;
    const gap = Math.abs(seg.departAt.getTime() - now.getTime());
    if (gap <= BOARDING_SUGGEST_WINDOW_MS && gap < bestGap) {
      best = seg;
      bestGap = gap;
    }
  });
  return best;
}
