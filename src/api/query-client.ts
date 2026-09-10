import { QueryClient } from "@tanstack/react-query";

import { DEFAULT_GC_TIME } from "./cache-policy";

/**
 * 앱 전역 QueryClient.
 * - retry 1회: 서버 일시 오류에 한 번은 자동 복구 시도, 그 이상은 UX상 재시도 버튼으로.
 * - refetchOnWindowFocus 는 RN에서는 기본 false에 가깝지만 명시적으로 꺼서 의도를 남긴다.
 * - gcTime: 화면을 나갔다 5분 뒤 돌아오면 스피너부터 뜨는 기본값 대신 넉넉히 둔다.
 *   staleTime 은 도메인별로 다르므로 여기서 정하지 않는다(cache-policy.ts).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      gcTime: DEFAULT_GC_TIME,
    },
  },
});
