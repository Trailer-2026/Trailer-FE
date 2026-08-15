import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { reelsKeys } from "@/src/features/reels/keys";

import {
  blockUser,
  getBlockedUsers,
  getLikedReels,
  getMyProfile,
  getMyReels,
  reportUser,
  unblockUser,
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

/**
 * 사용자 차단. 성공하면 릴스 캐시 전체(추천 목록 + 댓글)를 무효화한다.
 * 서버가 차단 상대의 릴스·댓글을 걸러서 주므로, 다시 받아오면 화면에서 사라진다.
 */
export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userIdx: number) => blockUser(userIdx),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reelsKeys.all });
      // 차단 목록 화면이 열려 있지 않아도 무효화해 둔다 — 다음에 들어가면 새로 받는다.
      queryClient.invalidateQueries({ queryKey: userKeys.blocks() });
    },
  });
}

/**
 * 사용자 신고. 신고해도 그 사람의 릴스·댓글이 나에게 안 보이게 되므로
 * 차단과 똑같이 릴스 캐시를 무효화한다.
 *
 * 차단 목록(GET /api/blocks)에는 신고가 잡히지 않는다 — 신고 해제 화면은 없다.
 */
export function useReportUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userIdx: number) => reportUser(userIdx),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reelsKeys.all }),
  });
}

/** 내가 차단한 사용자 목록. 차단/해제 mutation 이 이 캐시를 무효화한다. */
export function useBlockedUsers() {
  return useQuery({
    queryKey: userKeys.blocks(),
    queryFn: getBlockedUsers,
    staleTime: 1000 * 30,
  });
}

/**
 * 차단 해제. 목록에서 그 줄이 사라지고, 상대의 릴스·댓글이 다시 보여야 하므로
 * 차단 목록과 릴스 캐시를 함께 무효화한다(차단할 때와 정확히 반대).
 */
export function useUnblockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userIdx: number) => unblockUser(userIdx),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.blocks() });
      queryClient.invalidateQueries({ queryKey: reelsKeys.all });
    },
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
