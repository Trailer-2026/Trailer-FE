import type { ImageSourcePropType } from "react-native";

/** 풍경알림 카드 배경을 고르는 시간대 구분. */
export type SceneryTimeSlot = "morning" | "afternoon" | "evening";

export type SceneryBackground = {
  image: ImageSourcePropType;
  /**
   * 일러스트 위에 덮는 반투명 막. 배경이 그림이라 그냥 두면 글씨가 묻힌다.
   * 밝은 배경은 흰색, 밤 배경은 남색을 깔고 글자색을 뒤집는다.
   */
  scrim: string;
  /** 이미지 로딩 전에 잠깐 보이는 색 — 일러스트의 지배색과 맞춘다. */
  fallback: string;
  /** 본문 글자색(인사·문구·구간) */
  text: string;
  /** 보조 글자색(기준 시각·빈 상태 안내) */
  subText: string;
  /** 헤더의 '풍경알림' 라벨과 접기/펼치기 */
  head: string;
};

/**
 * 시간대 → 배경. 05~12시 아침, 12~18시 노을, 그 외 밤.
 *
 * Metro 는 대소문자를 구분한다 — 실제 파일명(back1.png)과 정확히 일치시킬 것.
 */
export const SCENERY_BACKGROUNDS: Record<SceneryTimeSlot, SceneryBackground> = {
  morning: {
    image: require("../../../assets/images/style/back1.png"),
    scrim: "rgba(255,255,255,0.70)",
    fallback: "#CFE4F3",
    text: "#111827",
    subText: "#6B7280",
    head: "#5E84F4",
  },
  afternoon: {
    image: require("../../../assets/images/style/back2.png"),
    scrim: "rgba(255,255,255,0.72)",
    fallback: "#F4D6BE",
    text: "#111827",
    subText: "#6B7280",
    head: "#5E84F4",
  },
  evening: {
    image: require("../../../assets/images/style/back3.png"),
    // 밤 그림은 이미 어두워서 흰 막을 씌우면 분위기가 죽는다 → 남색을 덮고 글자를 밝게.
    scrim: "rgba(18,23,45,0.55)",
    fallback: "#1E2440",
    text: "#FFFFFF",
    subText: "rgba(255,255,255,0.72)",
    head: "#FFFFFF",
  },
};

/** 지금 시각이 속한 시간대. */
export function sceneryTimeSlot(now: Date): SceneryTimeSlot {
  const h = now.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "evening";
}
