/**
 * 서버 station 리소스. 응답 필드명이 snake_case 라 그대로 유지한다.
 * (프론트 표기 관례로 바꿔 매핑하면 실 사용처 diff 만 늘어남)
 */
export type StationResponse = {
  station_idx: number;
  station_name: string;
};

/**
 * GET /api/stations 파라미터.
 * - query: 역명 부분일치 검색
 * - initial: 초성 한 글자 (ㄱ/ㄴ/ㄷ …). 자음 한 글자가 아니면 서버가 400.
 */
export type StationsQueryParams = {
  query?: string;
  initial?: string;
};
