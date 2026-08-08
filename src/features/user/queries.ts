import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { reelsKeys } from "@/src/features/reels/keys";

import {
  blockUser,
  getLikedReels,
  getMyProfile,
  getMyReels,
  updateNickname,
  updateProfileImage,
} from "./api";
import { userKeys } from "./keys";
import type { ProfileImageFile } from "./types";

/** 내 프로필 조회. 내 정보 탭 진입 시 자동 실행. */
export function useMyProfile() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: getMyProfile,
    staleTime: 1000 * 60, // 1분
  });
}

/**
 * 내가 올린 릴스(최신순) 무한 스크롤. next_cursor 가 null 이면 마지막 페이지.
 * 영상을 만들고 돌아오면 목록이 바뀌므로 캐시는 짧게 잡는다.
 */
export function useMyReels(enabled = true) {
  return useInfiniteQuery({
    queryKey: userKeys.myReels(),
    queryFn: ({ pageParam }) => getMyReels(pageParam),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled,
    staleTime: 1000 * 30,
    select: (data) => data.pages.flatMap((page) => page.items),
  });
}

/** 내가 좋아요한 릴스(누른 순) 무한 스크롤. 내 릴스 목록과 페이징 방식이 같다. */
export function useLikedReels(enabled = true) {
  return useInfiniteQuery({
    queryKey: userKeys.likedReels(),
    queryFn: ({ pageParam }) => getLikedReels(pageParam),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled,
    staleTime: 1000 * 30,
    select: (data) => data.pages.flatMap((page) => page.items),
  });
}

/** 좋아요 인덱스 한 번에 받아올 최대 개수 — 100개씩 3페이지면 대부분 덮인다. */
const LIKED_INDEX_LIMIT = 100;
const LIKED_INDEX_MAX_PAGES = 3;

/**
 * 피드용 좋아요 인덱스 — reels_idx → { liked, like_count }.
 *
 * 추천 API 가 liked/like_count 를 주지 않아서, 피드를 열 때 이 목록을 미리 받아
 * 하트의 초기 상태로 쓴다. 목록이 아주 길면 앞의 몇 페이지만 본다(그 뒤는 눌러 보면 서버가 확정).
 */
export function useLikedReelsIndex() {
  return useQuery({
    queryKey: userKeys.likedIndex(),
    queryFn: async () => {
      const index = new Map<number, { liked: boolean; like_count: number }>();
      let cursor: number | null = null;
      for (let page = 0; page < LIKED_INDEX_MAX_PAGES; page += 1) {
        const res = await getLikedReels(cursor, LIKED_INDEX_LIMIT);
        for (const item of res.items) {
          index.set(item.reels_idx, {
            liked: true, // 이 목록에 있다 = 내가 누른 것
            like_count: item.like_count,
          });
        }
        if (res.next_cursor == null) break;
        cursor = res.next_cursor;
      }
      return index;
    },
    staleTime: 1000 * 60, // 1분 — 피드를 오갈 때마다 다시 받지 않게
  });
}

/**
 * 사용자 차단. 성공하면 릴스 캐시 전체(추천 목록 + 댓글)를 무효화한다.
 * 서버가 차단 상대의 릴스·댓글을 걸러서 주므로, 다시 받아오면 화면에서 사라진다.
 */
export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userIdx: number) => blockUser(userIdx),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: reelsKeys.all }),
  });
}

/**
 * 닉네임 변경. 응답의 갱신된 프로필로 캐시를 바로 덮어써서 refetch 없이 반영한다.
 */
export function useUpdateNickname() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nickname: string) => updateNickname(nickname),
    onSuccess: (profile) => {
      queryClient.setQueryData(userKeys.profile(), profile);
    },
  });
}

/**
 * 프로필 사진 변경. 응답의 갱신된 프로필로 캐시를 덮어쓴다.
 */
export function useUpdateProfileImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: ProfileImageFile) => updateProfileImage(file),
    onSuccess: (profile) => {
      queryClient.setQueryData(userKeys.profile(), profile);
    },
  });
}
