import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getReelsComments,
  getRecommendedReels,
  likeComment,
  likeReels,
  postReelsComment,
  unlikeComment,
  unlikeReels,
} from "./api";
import { reelsKeys } from "./keys";
import type { Reels, ReelsComment, ReelsRecommendItem } from "./types";

/** 릴스 댓글 목록. 시트를 열었을 때만(reelsIdx 가 있을 때만) 요청한다. */
export function useReelsComments(reelsIdx: number | null) {
  return useQuery({
    queryKey: reelsKeys.comments(reelsIdx ?? -1),
    queryFn: () => getReelsComments(reelsIdx!),
    enabled: reelsIdx != null,
  });
}

/**
 * 댓글/답글 작성. 끝나면 목록을 무효화해 다시 받아온다.
 * (낙관적 추가는 하지 않는다 — 서버가 채우는 comment_idx·프로필을 그대로 쓰는 게 안전하다.)
 *
 * onSuccess 가 아니라 onSettled 인 이유: POST 는 서버에 반영됐는데 응답만 못 받는 경우가
 * 실제로 있다(연결 끊김 → ERR_NETWORK). 그때 onSuccess 만 쓰면 방금 쓴 댓글이 시트를
 * 닫았다 열기 전까지 안 보인다. 실패로 끝나도 일단 목록은 다시 받아온다.
 */
export function useCreateReelsComment(reelsIdx: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { content: string; parentIdx: number | null }) =>
      postReelsComment(reelsIdx!, vars.content, vars.parentIdx),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: reelsKeys.comments(reelsIdx ?? -1),
      }),
  });
}

/**
 * 릴스 좋아요 토글.
 *
 * 추천 API 가 liked/like_count 를 주지 않아 캐시에 덮어쓸 목록이 없다 —
 * 호출부(feed.tsx)가 응답값을 화면 상태로 들고 있는다.
 */
export function useToggleReelsLike() {
  return useMutation({
    mutationFn: (vars: { reelsIdx: number; liked: boolean }) =>
      vars.liked ? unlikeReels(vars.reelsIdx) : likeReels(vars.reelsIdx),
  });
}

/** 목록(최상위 + replies)에서 해당 댓글만 갈아끼운다. 나머지 참조는 그대로 둔다. */
function patchComment(
  list: ReelsComment[] | undefined,
  commentIdx: number,
  patch: Partial<ReelsComment>,
): ReelsComment[] | undefined {
  return list?.map((c) =>
    c.comment_idx === commentIdx
      ? { ...c, ...patch }
      : (c.replies ?? []).some((r) => r.comment_idx === commentIdx)
        ? {
            ...c,
            replies: c.replies.map((r) =>
              r.comment_idx === commentIdx ? { ...r, ...patch } : r,
            ),
          }
        : c,
  );
}

/**
 * 댓글·답글 좋아요 토글.
 *
 * 하트는 즉시 반응해야 해서 낙관적으로 먼저 뒤집고, 응답이 오면 서버 확정값으로 덮는다.
 * 실패하면 직전 목록으로 되돌린다(invalidate 하지 않는다 — 스크롤 중 목록이 통째로
 * 바뀌면 사용자가 보던 위치가 흔들린다).
 */
export function useToggleCommentLike(reelsIdx: number | null) {
  const queryClient = useQueryClient();
  const queryKey = reelsKeys.comments(reelsIdx ?? -1);

  return useMutation({
    mutationFn: (vars: { commentIdx: number; liked: boolean }) =>
      vars.liked ? unlikeComment(vars.commentIdx) : likeComment(vars.commentIdx),
    onMutate: async (vars) => {
      // 진행 중인 목록 요청이 낙관적 갱신을 덮어쓰지 않게 먼저 취소.
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ReelsComment[]>(queryKey);
      const target = previous
        ?.flatMap((c) => [c, ...(c.replies ?? [])])
        .find((c) => c.comment_idx === vars.commentIdx);
      queryClient.setQueryData<ReelsComment[]>(queryKey, (list) =>
        patchComment(list, vars.commentIdx, {
          liked: !vars.liked,
          like_count: Math.max(0, (target?.like_count ?? 0) + (vars.liked ? -1 : 1)),
        }),
      );
      return { previous };
    },
    onSuccess: (data, vars) => {
      queryClient.setQueryData<ReelsComment[]>(queryKey, (list) =>
        patchComment(list, vars.commentIdx, data),
      );
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
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
