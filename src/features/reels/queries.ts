import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { CACHE_POLICY } from "@/src/api/cache-policy";
import { userKeys } from "@/src/features/user/keys";

import {
  deleteReelsComment,
  getReelsComments,
  getRecommendedReels,
  likeComment,
  likeReels,
  postReelsComment,
  unlikeComment,
  unlikeReels,
  updateReelsComment,
} from "./api";
import { reelsKeys } from "./keys";
import type { Reels, ReelsComment, ReelsRecommendItem } from "./types";

/**
 * 릴스 댓글 목록. 시트를 열었을 때만(reelsIdx 가 있을 때만) 요청한다.
 * 닫았다 바로 다시 열면 캐시를 보여주고, 내 댓글 작성/삭제는 mutation 이 무효화한다.
 */
export function useReelsComments(reelsIdx: number | null) {
  return useQuery({
    queryKey: reelsKeys.comments(reelsIdx ?? -1),
    queryFn: () => getReelsComments(reelsIdx!),
    enabled: reelsIdx != null,
    ...CACHE_POLICY.LIVE,
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
 * 내 댓글 수정. 응답이 갱신된 댓글이라 목록 캐시의 그 항목만 갈아끼운다
 * (전체 무효화하면 보고 있던 스크롤 위치가 흔들린다).
 */
export function useUpdateReelsComment(reelsIdx: number | null) {
  const queryClient = useQueryClient();
  const queryKey = reelsKeys.comments(reelsIdx ?? -1);

  return useMutation({
    mutationFn: (vars: { commentIdx: number; content: string }) =>
      updateReelsComment(vars.commentIdx, vars.content),
    onSuccess: (updated, vars) => {
      queryClient.setQueryData<ReelsComment[]>(queryKey, (list) =>
        patchComment(list, vars.commentIdx, { content: updated.content }),
      );
    },
  });
}

/**
 * 내 댓글 삭제. 답글까지 함께 사라지므로 목록을 다시 받아온다
 * (한 항목만 지우면 서버가 지운 답글이 화면에 남는다).
 */
export function useDeleteReelsComment(reelsIdx: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentIdx: number) => deleteReelsComment(commentIdx),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: reelsKeys.comments(reelsIdx ?? -1),
      }),
  });
}

/**
 * 릴스 좋아요 토글.
 *
 * 추천 목록의 liked/like_count 는 서버가 내려주므로 초기 상태는 그걸 쓰고,
 * 누른 뒤의 확정값은 호출부(feed.tsx)가 화면 상태로 덮어쓴다.
 */
export function useToggleReelsLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { reelsIdx: number; liked: boolean }) =>
      vars.liked ? unlikeReels(vars.reelsIdx) : likeReels(vars.reelsIdx),
    // 좋아요가 곧 북마크라 목록이 바뀐다(하트를 풀면 목록에서 빠진다).
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: userKeys.likedReels(),
        exact: true,
      }),
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

/** 추천 응답 → 화면이 쓰는 Reels. 필드명만 맞춰 옮긴다(is_liked → liked, region → location). */
function toReels(item: ReelsRecommendItem): Reels {
  return {
    reels_idx: item.reels_idx,
    author: {
      name: item.nickname ?? "알 수 없음",
      avatar_url: item.profile_image,
      user_idx: item.user_idx ?? null,
    },
    video_url: item.url,
    thumbnail_url: item.thumbnail_url,
    caption: item.title ?? "",
    location: item.region,
    like_count: item.like_count,
    liked: item.is_liked,
    comment_count: item.comment_count,
  };
}

/** 홈 카드 개수. 피드가 캐시에서 같은 목록을 찾을 때도 이 값을 쓴다. */
export const HOME_PREVIEW_LIMIT = 3;

/**
 * 직전에 홈 카드로 보여준 reels_idx. 다음 요청의 exclude 로 넘겨 같은 릴스가
 * 다시 뽑히지 않게 한다(당겨서 새로고침 때마다 카드가 실제로 바뀌게).
 * 쿼리 키에 넣지 않는 이유: 키가 매번 달라지면 캐시 항목이 계속 쌓인다.
 * 서버는 뺄 게 없으면 exclude 를 무시하고 처음부터 다시 추천하므로 릴스가
 * 적어도 빈 목록이 되지 않는다.
 */
let lastPreviewIdx: number[] = [];

/**
 * 홈 '지금 사람들이 떠나는 여행' 카드용 — 추천에서 limit 개만 받는다.
 * 피드와 달리 무한 스크롤이 없어 useQuery 하나로 끝난다.
 */
export function useReelsPreview(limit: number) {
  return useQuery({
    queryKey: reelsKeys.preview(limit),
    queryFn: async () => {
      const items = await getRecommendedReels(lastPreviewIdx, limit);
      lastPreviewIdx = items.map((item) => item.reels_idx);
      return items.map(toReels);
    },
    // 홈을 오갈 때마다 다시 받지 않게 1분. 당겨서 새로고침이 명시적 갱신 경로다.
    staleTime: 1000 * 60,
    gcTime: CACHE_POLICY.FEED.gcTime,
  });
}

/**
 * exclude 로 넘길 최대 개수 — 쿼리스트링이 무한정 길어지면 요청이 깨진다.
 * 넘치면 오래 본 것부터 버린다(그만큼 다시 나올 수 있다).
 */
const EXCLUDE_LIMIT = 200;

/**
 * 릴스 추천 무한 스크롤.
 *
 * 페이지 파라미터는 지금까지 본 reels_idx 전부(= exclude) — 서버가 그만큼 빼고 새로 뽑는다.
 * 남은 게 없으면 서버가 exclude 를 무시하고 처음부터 다시 추천하는데, 그 반복분도 그대로
 * 이어 붙여 스크롤이 끊기지 않게 한다(릴스가 아예 없을 때만 멈춘다).
 * 같은 릴스가 여러 번 들어올 수 있으므로 화면 쪽 key·재생 판정은 인덱스 기준이다(feed.tsx).
 */
export function useRecommendedReels() {
  return useInfiniteQuery({
    queryKey: reelsKeys.recommend(),
    queryFn: ({ pageParam }) => getRecommendedReels(pageParam),
    initialPageParam: [] as number[],
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length === 0) return undefined; // 추천할 릴스가 하나도 없다
      const seen = allPages.flatMap((page) => page.map((r) => r.reels_idx));
      return seen.slice(-EXCLUDE_LIMIT);
    },
    // 스크롤 도중 목록이 뒤바뀌면 안 된다 — 피드 탭은 언마운트되지 않으므로 staleTime 은
    // 여기서 재요청을 일으키지 않는다. 오래 비웠다 돌아왔을 때의 갱신은 feed.tsx 가
    // 탭 포커스 시점에 이 staleTime 과 dataUpdatedAt 을 비교해 첫 페이지부터 다시 받는다.
    ...CACHE_POLICY.FEED,
    select: (data) => data.pages.flat().map(toReels),
  });
}
