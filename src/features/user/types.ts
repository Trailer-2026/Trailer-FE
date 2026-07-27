/**
 * 내 정보/프로필 설정 화면에서 쓰는 통합 프로필.
 * GET /api/users/me/profile 의 data. (auth 의 UserProfile 은 신원 확인용 최소 필드만 갖는
 * 상위 개념이고, 이쪽이 nickname·profile_image 까지 포함한 화면용 상세 프로필이다.)
 */
export type MyProfile = {
  user_idx: number;
  nickname: string;
  email: string | null;
  profile_image: string | null;
  provider: "google" | "kakao";
};

/** multipart 업로드에 넣을 이미지 파일 형태. expo-image-picker asset 에서 좁혀서 만든다. */
export type ProfileImageFile = {
  uri: string;
  name: string;
  type: string;
};
