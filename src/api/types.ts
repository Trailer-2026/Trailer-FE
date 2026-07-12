/**
 * 백엔드 공통 응답 엔벨로프. 모든 REST 응답이 이 구조로 온다.
 * data 가 null 인 경우는 message 를 오류 메시지로 사용.
 */
export type CommonResponse<T> = {
  code: number;
  message: string;
  data: T | null;
};
