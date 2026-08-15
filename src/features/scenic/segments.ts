import type {
  TravelDetail,
  TravelScheduleItem,
} from "@/src/features/travel/types";

/** 여행 상세에서 뽑아낸 열차 구간 1개 — 탑승 시작의 단위. */
export type TrainSegment = {
  scheduleIdx: number;
  fromStation: string;
  toStation: string;
  /** "KTX 101" 처럼 표시용. 등급·번호가 없으면 "열차" 로 폴백. */
  label: string;
  /** 출발 일시(해당 일차 날짜 + start_time). 시각 정보가 없으면 null. */
  departAt: Date | null;
  /**
   * 도착 일시(해당 일차 날짜 + end_time). 자동 탑승 종료의 기준.
   * 도착이 출발보다 이르면 자정을 넘긴 것으로 보고 하루를 더한다.
   */
  arriveAt: Date | null;
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
      const departAt = toDateTime(day.date, item.start_time);
      let arriveAt = toDateTime(day.date, item.end_time);
      // 심야 열차 — 도착이 출발보다 이르면 다음 날 도착이다.
      if (departAt && arriveAt && arriveAt.getTime() <= departAt.getTime()) {
        arriveAt = new Date(arriveAt.getTime() + 24 * 60 * 60 * 1000);
      }
      out.push({
        scheduleIdx: item.schedule_idx,
        fromStation: item.dep_station,
        toStation: item.arr_station,
        label,
        departAt,
        arriveAt,
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

/** 종료 시각이 없는 방문 일정을 얼마나 진행 중으로 볼지. */
const VISIT_FALLBACK_MS = 60 * 60 * 1000;

/**
 * 지금 진행 중인 **열차가 아닌** 일정 항목. 없으면 null.
 *
 * 알림 카드가 "지금 ○○ 일정 중이에요" 문구와, 사진을 붙일 schedule_idx 를
 * 정하는 데 쓴다(열차 구간은 탑승 세션에 이미 scheduleIdx 가 들어 있다).
 *
 * ponytail: 종료 시각이 없거나 시작보다 이르면 1시간짜리로 친다. 실제 체류
 * 시간이 필요해지면 서버 end_time 을 필수로 받아야 한다.
 */
export function findCurrentScheduleItem(
  detail: TravelDetail,
  now: Date,
): TravelScheduleItem | null {
  for (const day of detail.days) {
    for (const item of day.items) {
      if (item.kind === "train") continue;
      const start = toDateTime(day.date, item.start_time);
      if (!start) continue;
      let end = toDateTime(day.date, item.end_time);
      if (!end || end.getTime() <= start.getTime()) {
        end = new Date(start.getTime() + VISIT_FALLBACK_MS);
      }
      if (now.getTime() >= start.getTime() && now.getTime() < end.getTime()) {
        return item;
      }
    }
  }
  return null;
}

/**
 * 지금 **타고 있는 중**인 구간 — 출발 시각 ≤ 지금 < 도착 시각.
 * 자동 탑승 시작/종료의 기준이라 출발·도착 시각이 **둘 다** 있는 구간만 본다
 * (도착 시각을 모르면 언제 끝내야 할지 알 수 없어 자동으로 켜지 않는다).
 *
 * 구간이 겹치면 나중에 출발한 쪽을 고른다 — 환승 직후엔 새 열차가 맞다.
 */
export function findActiveSegment(
  segments: TrainSegment[],
  now: Date,
): TrainSegment | null {
  let best: TrainSegment | null = null;
  segments.forEach((seg) => {
    if (!seg.departAt || !seg.arriveAt) return;
    const t = now.getTime();
    if (t < seg.departAt.getTime() || t >= seg.arriveAt.getTime()) return;
    if (!best || seg.departAt.getTime() > best.departAt!.getTime()) best = seg;
  });
  return best;
}
