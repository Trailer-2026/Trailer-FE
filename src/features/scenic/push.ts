import { updateNotificationSettings } from "@/src/features/notification/settings-api";

/**
 * 창밖 풍경 **푸시 알림**을 끈다.
 *
 * 이번 릴리스에서 풍경알림은 푸시로 내보내지 않기로 했다 — 관광지 목록은 여행 상세
 * 타임라인(ScenicTimelineRow)에서만 보여주고, 푸시는 다음 업데이트로 넘긴다.
 *
 * 그런데 푸시를 쏘는 주체는 서버다. `GET /api/scenic-spots/nearby` 는 응답과 함께
 * 푸시를 발송하므로(scenic/api.ts 주석 참고) 앱이 호출을 멈추지 않는 한 프론트에서
 * 막을 방법이 없다. 목록을 보여주려면 호출은 계속해야 한다.
 *
 * 대신 서버의 사용자 설정 `scenery_alarm` 이 이 푸시를 가른다. 그래서 탑승이
 * 시작될 때 — 즉 /nearby 를 처음 부르기 직전에 — 이 값을 꺼 둔다.
 *
 * 실패해도 조용히 넘어간다. 알림이 한 번 더 오는 것뿐이고, 다음 탑승에서 다시 시도한다.
 *
 * TODO: 푸시를 다시 켜는 릴리스에서는 이 호출을 지우고 알림 설정 화면의
 *       '기차역 풍경 알림' 토글을 되살릴 것(profile/notifications.tsx 주석 참고).
 */
export async function disableScenicPush() {
  try {
    await updateNotificationSettings({ scenery_alarm: false });
  } catch {
    // 무시 — 푸시가 한 건 더 나갈 뿐이다.
  }
}
