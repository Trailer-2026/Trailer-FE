import { router } from "expo-router";

/**
 * 알림 → 이동할 화면 결정. 알림함 탭과 푸시 탭이 같은 규칙을 쓰도록 한곳에 모았다.
 *
 * type enum 이 서버 스펙에 명시돼 있지 않아 대소문자·표기 변형에 안전하게 substring 으로
 * 매칭한다. 어디로도 못 보내면 콘솔에 실제 값을 남기므로, 로그를 보고 규칙을 보강하면 된다.
 */
export type NotificationTarget = {
  /** 알림함의 item.type 또는 푸시 data.type */
  type?: string | null;
  /** 연결된 여행. 없으면 null */
  travelIdx?: number | null;
};

/** @returns 이동했으면 true */
export function openNotificationTarget({
  type,
  travelIdx,
}: NotificationTarget): boolean {
  const t = (type ?? "").toUpperCase();

  // 스탬프 획득 — 여행 상세가 아니라 스탬프 화면으로.
  if (t.includes("STAMP")) {
    router.push("/profile/stamps");
    return true;
  }

  // 삭제 알림은 원본 여행이 사라졌으니 상세로 갈 수 없다 → AI 일정 생성 진입점으로.
  if (t.includes("DELETE")) {
    router.push("/course/intro");
    return true;
  }

  if (travelIdx != null) {
    router.push({
      pathname: "/travel/[travelIdx]",
      params: { travelIdx },
    });
    return true;
  }

  console.log("[notification] 이동할 화면 없음 — type:", type, "travel_idx:", travelIdx);
  return false;
}

/** 문자열/숫자로 섞여 올 수 있는 FCM data 값을 숫자로. */
function toNumber(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

/**
 * FCM data 페이로드 → 라우팅 대상.
 * data 값은 항상 문자열로 오므로 travel_idx 를 숫자로 바꿔준다.
 */
export function targetFromFcmData(
  data: Record<string, unknown> | undefined,
): NotificationTarget {
  if (!data) return {};
  const type = typeof data.type === "string" ? data.type : null;
  return { type, travelIdx: toNumber(data.travel_idx) };
}
