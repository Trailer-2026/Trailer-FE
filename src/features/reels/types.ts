/**
 * 릴스 도메인 스키마. 서버 필드명(snake_case) 그대로 유지.
 *
 * 아직 릴스 조회 API 가 없어 목업(mock.ts)으로 채우지만,
 * 이후 GET 응답을 그대로 받아 쓸 수 있도록 실제 스키마 형태로 정의한다.
 */
export type Reels = {
  /** 좋아요 API 경로(/api/reels/{reels_idx}/likes)에 쓰는 식별자 */
  reels_idx: number;
  author: ReelsAuthor;
  /** 영상 제작 로직이 아직 없어 현재는 항상 null → thumbnail_url 로 대체 렌더 */
  video_url: string | null;
  thumbnail_url: string | null;
  caption: string;
  location: string | null;
  like_count: number;
  /** 내가 좋아요를 눌렀는지 */
  liked: boolean;
  comment_count: number;
};

export type ReelsAuthor = {
  name: string;
  avatar_url: string | null;
};

/** POST/DELETE /api/reels/{reels_idx}/likes 의 data */
export type LikeResponse = {
  liked: boolean;
  like_count: number;
};
