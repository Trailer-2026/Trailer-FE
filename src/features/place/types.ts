import type { Theme } from "@/src/features/course/types";

/**
 * /api/places/themed 응답 스키마.
 * 서버 필드명(snake_case) 그대로 유지.
 * theme 는 서버가 실제로 고른 테마 — 요청 시 지정한 값이 아니라 이걸 신뢰해 UI 에 표시.
 */
export type ThemedPlacesResponse = {
  theme: Theme;
  title: string;
  banner_image_url: string | null;
  places: ThemePlaceCard[];
};

export type ThemePlaceCard = {
  name: string;
  region: string;
  image_url: string | null;
};
