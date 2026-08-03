import { QueryClient } from "@tanstack/react-query";

/**
 * 앱 전역 QueryClient.
 * - retry 1회: 서버 일시 오류에 한 번은 자동 복구 시도, 그 이상은 UX상 재시도 버튼으로.
 * - refetchOnWindowFocus 는 RN에서는 기본 false에 가깝지만 명시적으로 꺼서 의도를 남긴다.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
