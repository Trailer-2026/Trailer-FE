/**
 * 사진→영상 렌더 도메인 스키마. 서버 필드명(snake_case) 그대로 유지.
 *
 * 렌더는 두 단계다:
 *  1) POST /api/videos/render/photos-only → job_id 즉시 반환(status=running)
 *  2) GET  /api/videos/render/{job_id}     → 위 job_id 로 진행률 폴링
 * 좌표 직접 입력 렌더(POST /api/videos/render)도 같은 폴링 응답을 쓰므로
 * VideoRenderStatusResponse / getRenderStatus 는 그쪽에서도 재사용한다.
 */

export type VideoEngine = "local" | "modal";

/** 계절 테마. default 는 조명/색보정 기본값. */
export type VideoTheme = "default" | "spring" | "summer" | "autumn" | "winter";

/** 조명 프리셋. 빈 문자열("")은 테마 기본 조명을 의미(서버 스펙). */
export type VideoLightPreset = "" | "dawn" | "day" | "dusk" | "night";

/**
 * 렌더 요청 옵션(멀티파트 텍스트 필드로 전송).
 * boolean 은 전송 시 "true"/"false" 문자열로 직렬화한다(api.ts).
 */
export type RenderOptions = {
  engine: VideoEngine;
  theme: VideoTheme;
  light_preset: VideoLightPreset;
  intro: boolean;
  outro: boolean;
  /** 빠른 렌더. 이번엔 개발용으로 항상 true 고정(프로덕션 토글은 다음 작업). */
  quick: boolean;
  /** BGM 파일/식별자. 목록 API 가 없어 이번엔 "" (무음). */
  bgm: string;

  // TODO(향후): 출발지 지정 렌더. 이번엔 미전송(첫 사진 위치에서 시작).
  // start_name?: string;
  // start_latitude?: number;
  // start_longitude?: number;
};

/** GET /api/videos/render/{job_id} 및 렌더 시작 응답의 data. */
export type VideoRenderStatusResponse = {
  job_id: string;
  status: "running" | "done" | "failed";
  /** 서버 내부 단계 문자열(예: "prepare", "render", "post"). UI 라벨은 별도 매핑. */
  phase: string;
  /** 0~100 진행률 */
  percent: number;
  frame: number;
  total_frames: number | null;
  elapsed_seconds: number;
  eta_seconds: number | null;
  engine: string;
  theme: string;
  light_preset: string | null;
  intro: boolean;
  outro: boolean;
  bgm: string | null;
  /** status=done 일 때 완성 영상(mp4) URL */
  video_url: string | null;
  /** status=done 일 때 생성된 릴스 식별자/URL */
  reels_idx: number | null;
  reels_url: string | null;
  /** status=failed 일 때 실패 사유 */
  error: string | null;
  log_tail: string;
};
