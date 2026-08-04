import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type { NotificationSettings, NotificationUpdateRequest } from "./types";

/**
 * GET /api/users/me/notifications
 * 설정을 바꾼 적 없는 사용자는 서버가 기본값(둘 다 true)으로 생성해서 반환한다.
 * 401: client.ts 인터셉터가 refresh/로그아웃 처리.
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const res = await api.get<CommonResponse<NotificationSettings>>(
    "/api/users/me/notifications",
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * PATCH /api/users/me/notifications
 * 보낸 항목만 갱신. 한 토글씩 뒤집을 때는 그 필드만 담아 보낸다.
 * 응답은 갱신된 전체 설정.
 */
export async function updateNotificationSettings(
  body: NotificationUpdateRequest,
): Promise<NotificationSettings> {
  const res = await api.patch<CommonResponse<NotificationSettings>>(
    "/api/users/me/notifications",
    body,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
