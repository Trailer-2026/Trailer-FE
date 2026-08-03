import type { RenderOptions, VideoTheme } from "./types";

/**
 * 렌더 옵션 UI(칩)에서 쓰는 선택지 + 라벨.
 * BGM 목록은 서버(getBgmTracks)에서 받아 동적으로 구성하므로 여기엔 테마만 둔다.
 */

export const THEME_OPTIONS: { value: VideoTheme; label: string }[] = [
  { value: "default", label: "기본" },
  { value: "spring", label: "봄" },
  { value: "summer", label: "여름" },
  { value: "autumn", label: "가을" },
  { value: "winter", label: "겨울" },
];

/** 렌더 옵션 기본값 — 기본 테마 + 무음. */
export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  theme: "default",
  bgm: "",
};
