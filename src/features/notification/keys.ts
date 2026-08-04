/**
 * 알림(설정 / 알림함) react-query key 팩토리.
 * 설정과 목록은 서로 독립이지만, 배지(unread_count)는 목록 캐시 안에 들어있어
 * 목록을 invalidate 하면 배지도 함께 갱신된다.
 */
export const notificationKeys = {
  all: ["notifications"] as const,
  settings: () => [...notificationKeys.all, "settings"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
};
