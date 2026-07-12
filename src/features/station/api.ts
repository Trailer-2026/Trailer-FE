import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type { StationResponse, StationsQueryParams } from "./types";

/**
 * GET /api/stations
 * - params 미지정 시 전체 역 목록(가나다 정렬) 반환.
 * - query/initial 조합은 서버가 AND 로 처리.
 * - CommonResponse.data 가 null 로 오는 경우는 서버 오류 취급.
 */
export async function getStations(
  params?: StationsQueryParams,
): Promise<StationResponse[]> {
  const res = await api.get<CommonResponse<StationResponse[]>>(
    "/api/stations",
    { params },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
