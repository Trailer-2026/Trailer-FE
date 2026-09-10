/**
 * reels react-query key 팩토리.
 *
 * 트리: reels
 *        ├─ recommend            ← 피드(무한 스크롤)
 *        │   └─ preview, limit   ← 홈 카드
 *        └─ comments, reelsIdx
 *
 * 릴스가 생기거나 지워지거나 제목이 바뀌면 `recommend()` 를 무효화한다 — 피드와 홈 카드가
 * 함께 걸리고 댓글 캐시는 건드리지 않는다. `all` 은 차단/신고처럼 댓글까지 바뀔 때만 쓴다.
 */
export const reelsKeys = {
  all: ["reels"] as const,
  recommend: () => [...reelsKeys.all, "recommend"] as const,
  /** 홈 카드용 미리보기 — 무한 스크롤 목록과 캐시를 섞지 않게 키를 분리한다. */
  preview: (limit: number) =>
    [...reelsKeys.all, "recommend", "preview", limit] as const,
  comments: (reelsIdx: number) =>
    [...reelsKeys.all, "comments", reelsIdx] as const,
};
