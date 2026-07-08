import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";
import type { Theme } from "@/src/features/course/types";

import type { ThemedPlacesResponse } from "./types";

/**
 * GET /api/places/themed
 * - theme 지정 시 해당 테마 결과, 미지정 시 서버가 랜덤 테마 선택.
 * - 데이터 소스가 실시간 TourAPI 라 응답이 다소 느릴 수 있음(전역 timeout 10s 유지).
 * - CommonResponse.data 가 null 이면 서버 오류로 취급.
 */
export async function getThemedPlaces(
  theme?: Theme,
): Promise<ThemedPlacesResponse> {
  const res = await api.get<CommonResponse<ThemedPlacesResponse>>(
    "/api/places/themed",
    { params: theme ? { theme } : undefined },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
