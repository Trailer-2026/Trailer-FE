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

/**
 * 영상 만들기에서 사용자가 고른 미디어 1개.
 *
 * 갤러리에서 받은 원본(ImagePickerAsset)을 그대로 들고 다니지 않고 이 형태로 좁힌다.
 * taken_at / latitude / longitude 는 EXIF 에서 뽑은 값 — 없을 수 있어 전부 nullable.
 * TODO(백엔드 업로드): 생성하기 시 이 배열을 순서대로 multipart 로 전송한다.
 */
export type ReelsMediaAsset = {
  /** 로컬 file:// URI — 업로드 시 이 경로를 multipart 로 올린다 */
  uri: string;
  kind: "image" | "video";
  width: number;
  height: number;
  /** 영상 길이(ms). 사진이면 null */
  duration: number | null;
  file_name: string | null;
  /** EXIF 촬영 시각 (ISO 8601). 메타데이터 없으면 null */
  taken_at: string | null;
  /** EXIF GPS. 안드로이드 시스템 피커는 기본적으로 위치를 지워서 보내므로 대개 null */
  latitude: number | null;
  longitude: number | null;
};
