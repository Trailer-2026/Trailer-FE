import type { ScenicCategory, ScenicSide } from "./types";

/** 거리(m) → "320m" / "1.2km" */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return "";
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/** Date → "오전 9:00" (기기 로컬 시각 기준). */
export function formatClockLabel(d: Date): string {
  if (Number.isNaN(d.getTime())) return "";
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h < 12 ? "오전" : "오후"} ${h12}:${m}`;
}

/** based_at(KST ISO) → "오전 9:00". 파싱 실패 시 빈 문자열. */
export function formatBasedAt(iso: string): string {
  return formatClockLabel(new Date(iso));
}

/**
 * 시각표의 eta·dep_at·arr_at("2026-08-16T09:51:00") → Date.
 *
 * 타임존이 없는 KST wall-clock 이다. 오프셋 없는 ISO 문자열은 JS 가 **기기 로컬**
 * 시각으로 해석하므로 기기가 한국 시각이면 그대로 맞다. `Z` 를 붙이거나 UTC 로
 * 읽으면 9시간이 어긋난다. 파싱 실패 시 null.
 */
export function parseWallClock(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** eta → "오전 9:51". 파싱 실패 시 빈 문자열. */
export function formatEta(eta: string): string {
  const d = parseWallClock(eta);
  return d ? formatClockLabel(d) : "";
}

/** 진행 방향 기준 창밖 좌/우 라벨. 방향을 모르면 "창밖". */
export function sideLabel(side: ScenicSide | null): string {
  if (side === "left") return "왼쪽 창밖";
  if (side === "right") return "오른쪽 창밖";
  return "창밖";
}

/** 서버 분류(water | waterway | peak | natural_view) → 사람이 읽는 라벨. */
export function categoryLabel(category: ScenicCategory | string): string {
  switch (category) {
    case "water":
      return "호수·바다";
    case "waterway":
      return "강·하천";
    case "peak":
      return "산";
    case "natural_view":
      return "자연 경관";
    default:
      return category;
  }
}
