import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMyProfile, updateNickname, updateProfileImage } from "./api";
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
