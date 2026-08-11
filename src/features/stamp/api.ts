import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type { StampListResponse } from "./types";

/**
 * GET /api/users/me/stamps — 내 스탬프 목록.
 *
 * 미달성 칸까지 전부 담아 오고 정렬도 서버가 끝낸 상태다. 앱은 순서 그대로 그리고,
 * achieved=false 인 칸에 자물쇠를 덮는 것만 담당한다.
 * 401: client.ts 인터셉터가 refresh/로그아웃 처리.
 */
export async function getMyStamps(): Promise<StampListResponse> {
  const res = await api.get<CommonResponse<StampListResponse>>(
    "/api/users/me/stamps",
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
