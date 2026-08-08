import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { reelsKeys } from "@/src/features/reels/keys";

import {
  blockUser,
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
export function useMyReels() {
  return useInfiniteQuery({
    queryKey: userKeys.myReels(),
    queryFn: ({ pageParam }) => getMyReels(pageParam),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
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
