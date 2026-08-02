/** reels react-query key 팩토리. */
export const reelsKeys = {
  all: ["reels"] as const,
  recommend: () => [...reelsKeys.all, "recommend"] as const,
  comments: (reelsIdx: number) =>
    [...reelsKeys.all, "comments", reelsIdx] as const,
};
