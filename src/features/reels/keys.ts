/** reels react-query key 팩토리. */
export const reelsKeys = {
  all: ["reels"] as const,
  recommend: () => [...reelsKeys.all, "recommend"] as const,
  /** 홈 카드용 미리보기 — 무한 스크롤 목록과 캐시를 섞지 않게 키를 분리한다. */
  preview: (limit: number) =>
    [...reelsKeys.all, "recommend", "preview", limit] as const,
  comments: (reelsIdx: number) =>
    [...reelsKeys.all, "comments", reelsIdx] as const,
};
