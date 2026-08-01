/**
 * 사진→영상 렌더 도메인 스키마. 서버 필드명(snake_case) 그대로 유지.
 *
 * 1) POST /api/videos/render/photos-only → reels_idx 즉시 반환(status=running)
 * 2) GET  /api/videos/render/{reels_idx}  → 위 reels_idx 로 진행률 폴링
 * 릴스 행은 렌더 시작 시 로그인 사용자와 연결돼 미리 생성되고(영상 없는 동안 피드 미노출),
 * 완료되면 그 행의 url 에 GCS 주소가 채워진다. 실패하면 릴스 행은 삭제된다.
 * 엔진은 항상 modal, 인트로/아웃트로는 항상 붙으므로 요청 옵션이 없다.
 */

/** 지도 계절 테마. */
export type VideoTheme = "default" | "spring" | "summer" | "autumn" | "winter";

/** GET BGM 목록의 트랙 1개. file 을 렌더 요청 bgm 값으로 그대로 쓴다. */
export type BgmTrackResponse = {
  /** bgm 폴더 내 파일명 — 렌더 요청 bgm 값 */
  file: string;
  /** 표시용 곡명 */
  title: string;
  /** 아티스트명 (파싱 실패 시 "") */
  artist: string;
  /** 음원 출처 (예: Pixabay, 없으면 "") */
  source: string;
};

/** 렌더 요청 옵션(멀티파트 텍스트 필드로 전송). */
export type RenderOptions = {
  theme: VideoTheme;
  /** BGM 파일명(BgmTrackResponse.file) 또는 "" (무음). */
  bgm: string;
  // 출발지(선택) — 위도/경도는 함께 지정. 생략 시 첫 사진 위치에서 시작.
  start_name?: string;
  start_latitude?: number;
  start_longitude?: number;
};

/** GET /api/videos/render/{reels_idx} 및 렌더 시작 응답의 data. */
export type VideoRenderStatusResponse = {
  /** 릴스 PK — 진행률 조회·다운로드·편집 공용 키 */
  reels_idx: number;
  /** unknown = 서버 재시작으로 진행 정보가 사라진 미완료 릴스 */
  status: "running" | "done" | "failed" | "unknown";
  /** 현재 단계(렌더 준비 중 / 프레임 렌더링 / 후처리 / 완료) */
  phase: string;
  /** 0~100 진행률 */
  percent: number;
  frame: number;
  total_frames: number | null;
  elapsed_seconds: number;
  eta_seconds: number | null;
  /** 항상 "modal" */
  engine: string;
  theme: string;
  bgm: string | null;
  /** status=done 일 때 완성 영상(GCS 공개) URL */
  video_url: string | null;
  reels_url: string | null;
  /** status=failed/unknown 일 때 실패 사유 */
  error: string | null;
  log_tail: string;
};
