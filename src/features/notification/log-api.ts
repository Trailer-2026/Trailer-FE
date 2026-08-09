import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type { NotificationLogListResponse } from "./types";

/**
 * GET /api/notifications?limit&cursor
 * - limit: 1~100 (기본 20)
 * - cursor: 다음 페이지 커서. 첫 페이지는 생략.
 * - unread_count 는 페이징 무관 전체 미읽음 개수(탭 배지용).
 */
export async function getNotifications(params: {
  limit?: number;
  cursor?: number | null;
}): Promise<NotificationLogListResponse> {
  const { limit = 20, cursor } = params;
  const res = await api.get<CommonResponse<NotificationLogListResponse>>(
    "/api/notifications",
    { params: { limit, ...(cursor != null ? { cursor } : {}) } },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * PATCH /api/notifications/{notification_log_idx}/read — 1건 읽음(멱등, data=null).
 * 404: 없거나 내 알림 아님.
 */
export async function readNotification(
  notificationLogIdx: number,
): Promise<void> {
  await api.patch<CommonResponse<null>>(
    `/api/notifications/${notificationLogIdx}/read`,
  );
}

/**
 * PATCH /api/notifications/read-all — 전체 읽음(멱등, data=null).
 * 읽을 게 없어도 성공한다.
 */
export async function readAllNotifications(): Promise<void> {
  await api.patch<CommonResponse<null>>("/api/notifications/read-all");
}
