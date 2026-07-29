import type {
  RenderOptions,
  VideoEngine,
  VideoLightPreset,
  VideoTheme,
} from "./types";

/**
 * 렌더 옵션 UI(칩/토글)에서 쓰는 선택지 + 한글 라벨.
 * value 는 서버로 그대로 보내는 값, label 만 화면 표기용.
 */

export const THEME_OPTIONS: { value: VideoTheme; label: string }[] = [
  { value: "default", label: "기본" },
  { value: "spring", label: "봄" },
  { value: "summer", label: "여름" },
  { value: "autumn", label: "가을" },
  { value: "winter", label: "겨울" },
];

export const LIGHT_OPTIONS: { value: VideoLightPreset; label: string }[] = [
  { value: "", label: "기본" }, // 빈 값 = 테마 기본 조명
  { value: "dawn", label: "새벽" },
  { value: "day", label: "낮" },
  { value: "dusk", label: "해질녘" },
  { value: "night", label: "밤" },
];

export const ENGINE_OPTIONS: { value: VideoEngine; label: string }[] = [
  { value: "local", label: "로컬" },
  { value: "modal", label: "모달" },
];

/**
 * 렌더 옵션 기본값.
 * - engine: modal(GPU) 이 실제 동작·최적화된 렌더 경로다. local 은 백엔드 머신에서
 *   GPU 없이 직접 렌더라 느리거나 미구성일 수 있어 기본은 modal.
 * - quick: true 고정(빠른 렌더). bgm: "" 무음.
 */
export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  engine: "modal",
  theme: "default",
  light_preset: "",
  intro: false,
  outro: false,
  quick: true,
  bgm: "",
};
