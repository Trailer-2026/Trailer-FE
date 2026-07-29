import type { TravelStatus } from "./types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** "2026-07-08" 형태의 ISO 날짜 → "07.08(수)" */
function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}.${day}(${WEEKDAYS[d.getDay()]})`;
}

/** "07.08(수) ~ 07.10(금)" */
export function formatTravelPeriod(startIso: string, endIso: string): string {
  return `${formatShortDate(startIso)} ~ ${formatShortDate(endIso)}`;
}

/** "2026-06-30" → "2026.06.30" (여행 조회 카드용 날짜 표기) */
export function formatDotDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${m}.${day}`;
}

/**
 * 일정표 상세의 시각 필드는 ISO datetime 이 아니라 "HH:MM:SS" 문자열이다.
 * 추천 결과의 ISO 포맷터(new Date 파싱)를 쓰면 안 되고 앞 5자리(HH:MM)만 취한다.
 */
export function formatClockTime(hms: string | null | undefined): string {
  if (!hms) return "";
  const m = /^(\d{1,2}):(\d{2})/.exec(hms);
  if (!m) return "";
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

/** "2026-07-08" → "07.08 (수)" — 일정표 상세 DAY 헤더 날짜 표기. */
export function formatDayDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${mo}.${day} (${WEEKDAYS[d.getDay()]})`;
}

export function travelStatusLabel(status: TravelStatus): string {
  switch (status) {
    case "PLANNED":
      return "예정";
    case "ONGOING":
      return "여행중";
    case "COMPLETED":
      return "완료";
  }
}
