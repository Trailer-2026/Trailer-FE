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

/**
 * GET /api/users/me/reels 의 항목 — 홈 피드 카드(추천)와 같은 필드 구성.
 * 렌더가 끝나지 않은 릴스는 목록에서 빠지므로 url 은 항상 재생 가능하다.
 */
export type MyReelsItem = {
  reels_idx: number;
  url: string;
  title: string | null;
  /** 카드 좌상단 지역 태그. 옛 릴스는 null */
  region: string | null;
  /** 대표 프레임. 없으면 url 영상 첫 프레임으로 대체 */
  thumbnail_url: string | null;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  nickname: string | null;
  profile_image: string | null;
};

/** 커서 페이징 응답. next_cursor 가 null 이면 마지막 페이지. */
export type MyReelsListResponse = {
  items: MyReelsItem[];
  next_cursor: number | null;
};

/** multipart 업로드에 넣을 이미지 파일 형태. expo-image-picker asset 에서 좁혀서 만든다. */
export type ProfileImageFile = {
  uri: string;
  name: string;
  type: string;
};
