/**
 * video 렌더 관련 react-query key 팩토리.
 * 진행률 폴링은 reels_idx 단위로 캐시되므로 status(reelsIdx) 로 세분화한다.
 */
export const videoKeys = {
  all: ["video"] as const,
  status: (reelsIdx: number) =>
    [...videoKeys.all, "status", reelsIdx] as const,
  bgm: () => [...videoKeys.all, "bgm"] as const,
};
