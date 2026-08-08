const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HAS_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/;
const NAIVE_DATETIME = /^\d{4}-\d{2}-\d{2}[T ](\d{2}):(\d{2})/;

/**
 * ISO8601 문자열 → KST(Asia/Seoul) 기준 시:분.
 * 기기 타임존과 무관하게 항상 한국 시간으로 읽는다. (한국은 서머타임 없음)
 * - 오프셋이 붙은 문자열: UTC 로 환산 후 +9h
 * - 오프셋 없는 문자열: 이미 KST 로 간주하고 문자열의 시:분을 그대로 사용
 *   (기기 타임존으로 파싱되는 것을 막기 위함)
 */
export function kstHourMinute(
  iso: string | null | undefined,
): { h: number; m: number } | null {
  if (!iso) return null;
  if (!HAS_OFFSET.test(iso)) {
    const naive = NAIVE_DATETIME.exec(iso);
    if (naive) return { h: Number(naive[1]), m: Number(naive[2]) };
  }
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const d = new Date(t + KST_OFFSET_MS);
  return { h: d.getUTCHours(), m: d.getUTCMinutes() };
}

/**
 * 응답에 담긴 ISO8601(+09:00) 문자열을 KST 기준 HH:MM 으로 변환.
 * 실패 시 원본 문자열 반환.
 */
export function formatIsoToHhmm(iso: string | null | undefined): string {
  if (!iso) return "";
  const hm = kstHourMinute(iso);
  if (!hm) return iso;
  return `${String(hm.h).padStart(2, "0")}:${String(hm.m).padStart(2, "0")}`;
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
