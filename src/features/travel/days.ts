import type { TravelDay, TravelDetail } from "./types";

/** 일자 선택 칩에 필요한 최소 정보. */
export type TravelDayOption = Pick<TravelDay, "day_no" | "date">;

/** 한 여행이 가질 수 있는 최대 일수 — 잘못된 날짜로 무한 루프가 돌지 않게 하는 상한. */
const MAX_DAYS = 60;

/**
 * 일정 추가/편집에서 고를 수 있는 날짜 목록.
 *
 * 상세 응답의 `days` 를 쓰지 않고 **여행 기간(start_date~end_date)에서 직접 만든다.**
 * `days` 는 일정 항목이 있는 날만 담겨 올 수 있어서, 직접 만든 빈 여행이나 아직
 * 비어 있는 일차는 선택지 자체가 없어져 항목을 추가할 수 없게 된다.
 * day_no·date 의 관계(date = start_date + (day_no-1))는 서버와 동일하다.
 */
export function buildSelectableDays(
  detail: Pick<TravelDetail, "start_date" | "end_date">,
): TravelDayOption[] {
  const start = new Date(`${detail.start_date}T00:00:00`);
  const end = new Date(`${detail.end_date}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const out: TravelDayOption[] = [];
  const cursor = new Date(start);
  for (let n = 1; cursor <= end && n <= MAX_DAYS; n += 1) {
    out.push({ day_no: n, date: toIsoDate(cursor) });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/** Date → "YYYY-MM-DD". toISOString() 은 UTC 로 밀리므로 직접 조립한다. */
function toIsoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
