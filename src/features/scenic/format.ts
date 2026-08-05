import type { ScenicSide } from "./types";

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

/** 진행 방향 기준 창밖 좌/우 라벨. */
export function sideLabel(side: ScenicSide): string {
  return side === "left" ? "왼쪽 창밖" : "오른쪽 창밖";
}
