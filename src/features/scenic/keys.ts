/**
 * 풍경 알림 react-query key 팩토리.
 *
 * plan 은 계정당 하나(서버가 대상 열차를 고른다)라 파라미터가 없다.
 * nearby 는 호출 시점의 좌표에 묶이는 조회라 캐시하지 않는다(키 없음).
 */
export const scenicKeys = {
  all: ["scenic"] as const,
  plan: () => [...scenicKeys.all, "plan"] as const,
};
