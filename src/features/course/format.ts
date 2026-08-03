/**
 * 응답에 담긴 ISO8601(+09:00) 문자열을 HH:MM 으로 변환.
 * 실패 시 원본 문자열 반환.
 */
export function formatIsoToHhmm(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** total_travel_minutes → "3시간 42분" */
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
}

/** 요금 → "42,300원" */
export function formatFare(fare: number): string {
  return `${fare.toLocaleString("ko-KR")}원`;
}
