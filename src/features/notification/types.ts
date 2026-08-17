/**
 * 알림 설정 / 알림함 관련 스키마. 서버 필드명(snake_case) 그대로 유지.
 * FCM(수신·토큰 등)은 fcm.ts / handlers.ts 참조.
 */

/**
 * GET/PATCH /api/users/me/notifications
 *
 * 앞의 둘만 푸시 발송을 가른다. marketing_agree 는 알림 발송과 무관한 선택 동의라
 * 기본값이 false 고(알림 두 항목만 true), 앱에서는 '이벤트 및 마케팅 알림' 을 켤 수
 * 있는 전제로 쓴다.
 */
export type NotificationSettings = {
  /**
   * 이벤트 알림 — 일정 알림(여행 담기·출발 D-1·일정 삭제)과 열차 출발 10분 전
   * 탑승 알림을 함께 켜고 끈다. 탑승 알림용 스위치가 따로 있지 않다.
   */
  event_alarm: boolean;
  /** 기차역 풍경 알림(창밖 스팟 근접 시 푸시) */
  scenery_alarm: boolean;
  /** 이벤트 및 마케팅 활용 동의 — 선택 동의라 한 번도 켠 적 없으면 false */
  marketing_agree: boolean;
};

/**
 * PATCH body — 보낸 항목만 서버가 갱신하고, 안 보낸 필드는 유지한다.
 * (한 토글만 뒤집을 때 다른 값을 함께 실어보내지 말 것 — 다른 창에서 바뀐 값을
 *  덮어쓸 위험.)
 */
export type NotificationUpdateRequest = Partial<NotificationSettings>;

/**
 * 알림함 목록 1건.
 * body 는 이미 서버에서 완성된 표시 문자열이라 프론트에서 조합할 필요가 없다.
 * travel_idx 가 있으면 탭 시 해당 여행 상세로 이동한다(null 이면 이동 없이 읽음만).
 * 여기 쌓이는 이벤트는 "여행 담기 / 출발 D-1 / 여행 삭제" — 실시간 창밖 풍경 알림은
 * 푸시로만 나가고 이 목록엔 포함되지 않는다.
 */
export type NotificationLogItem = {
  notification_log_idx: number;
  type: string;
  title: string;
  body: string;
  travel_idx: number | null;
  is_read: boolean;
  /** ISO8601 (+09:00) */
  created_at: string;
};

/**
 * GET /api/notifications 응답.
 * - items: 최신순
 * - next_cursor: null 이면 마지막 페이지
 * - unread_count: 페이징 무관 전체 기준(탭 배지용)
 */
export type NotificationLogListResponse = {
  unread_count: number;
  items: NotificationLogItem[];
  next_cursor: number | null;
};
