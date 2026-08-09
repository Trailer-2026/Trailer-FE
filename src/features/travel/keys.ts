/**
 * travel 관련 react-query key 팩토리.
 * mutation 성공 시 invalidateQueries(travelKeys.current) 로 홈 카드 갱신.
 */
export const travelKeys = {
  all: ["travels"] as const,
  current: () => [...travelKeys.all, "current"] as const,
  past: () => [...travelKeys.all, "past"] as const,
  detail: (travelIdx: number) =>
    [...travelKeys.all, "detail", travelIdx] as const,
  tickets: (travelIdx: number) =>
    [...travelKeys.all, "tickets", travelIdx] as const,
};
