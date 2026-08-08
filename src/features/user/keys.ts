/**
 * user(내 프로필) 관련 react-query key 팩토리.
 * 닉네임·프로필사진 mutation 은 응답으로 갱신된 프로필을 그대로 주므로
 * invalidate 대신 setQueryData(userKeys.profile) 로 캐시를 덮어쓴다.
 */
export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  myReels: () => [...userKeys.all, "reels"] as const,
  likedReels: () => [...userKeys.all, "reels", "liked"] as const,
  /** 좋아요 여부만 모아 둔 인덱스(피드에서 하트 초기 상태로 쓴다) */
  likedIndex: () => [...userKeys.all, "reels", "liked", "index"] as const,
};
