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
