import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { getReelsComments, getRecommendedReels } from "./api";
import { reelsKeys } from "./keys";
import type { Reels, ReelsRecommendItem } from "./types";

/** 릴스 댓글 목록. 시트를 열었을 때만(reelsIdx 가 있을 때만) 요청한다. */
export function useReelsComments(reelsIdx: number | null) {
  return useQuery({
    queryKey: reelsKeys.comments(reelsIdx ?? -1),
    queryFn: () => getReelsComments(reelsIdx!),
    enabled: reelsIdx != null,
  });
}

/** 추천 응답 → 화면이 쓰는 Reels. 좋아요·댓글 수는 추천 API 가 주지 않아 0 으로 둔다. */
function toReels(item: ReelsRecommendItem): Reels {
  return {
    reels_idx: item.reels_idx,
    author: { name: item.nickname ?? "알 수 없음", avatar_url: item.profile_image },
    video_url: item.url,
    thumbnail_url: null,
    caption: item.title ?? "",
    location: null,
    like_count: 0,
    liked: false,
    comment_count: 0,
  };
}

/**
 * 릴스 추천 무한 스크롤.
 *
 * 페이지 파라미터는 지금까지 받은 reels_idx 전부(= exclude). 서버는 제외하고 남은 게
 * 없으면 exclude 를 무시하고 처음부터 다시 추천하므로, 새 릴스가 하나도 없는 페이지가
 * 오면 한 바퀴 돈 것으로 보고 멈춘다.
 */
export function useRecommendedReels() {
  return useInfiniteQuery({
    queryKey: reelsKeys.recommend(),
    queryFn: ({ pageParam }) => getRecommendedReels(pageParam),
    initialPageParam: [] as number[],
    getNextPageParam: (lastPage, allPages) => {
      const seen = new Set(
        allPages.slice(0, -1).flatMap((page) => page.map((r) => r.reels_idx)),
      );
      if (lastPage.every((r) => seen.has(r.reels_idx))) return undefined;
      lastPage.forEach((r) => seen.add(r.reels_idx));
      return [...seen];
    },
    // 스크롤 도중 목록이 뒤바뀌지 않도록 자동 갱신은 하지 않는다.
    staleTime: Infinity,
    select: (data) => {
      const seen = new Set<number>();
      const list: Reels[] = [];
      for (const item of data.pages.flat()) {
        if (seen.has(item.reels_idx)) continue; // 서버가 한 바퀴 돌아 겹친 항목
        seen.add(item.reels_idx);
        list.push(toReels(item));
      }
      return list;
    },
  });
}
