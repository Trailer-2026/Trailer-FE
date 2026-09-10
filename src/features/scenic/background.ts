import type { ImageSourcePropType } from "react-native";

/** 풍경알림 카드 배경을 고르는 시간대 구분. */
export type SceneryTimeSlot = "morning" | "afternoon" | "evening";

export type SceneryBackground = {
  image: ImageSourcePropType;
  /** 이미지 로딩 전에 잠깐 보이는 색 — 일러스트의 지배색과 맞춘다. */
  fallback: string;
  /** 본문 글자색(인사·문구·구간) */
  text: string;
  /** 보조 글자색(기준 시각·빈 상태 안내) */
  subText: string;
  /** 헤더의 접기/펼치기 */
  head: string;
};

/**
 * 일러스트 위에 덮는 흰색 세로 그라디언트(시안의 `풍경알림_일러스트_그라디언트`).
 * 글씨가 얹히는 위쪽만 불투명하게 덮고 아래로 갈수록 그림이 그대로 드러난다.
 * 시간대와 무관하게 같은 값이라 배경별로 나누지 않는다.
 */
export const SCENERY_SCRIM = {
  expanded: {
    colors: ["rgba(255,255,255,1)", "rgba(255,255,255,0)"] as const,
    locations: [0, 1] as const,
  },
  /** 접었을 때는 카드가 낮아 아래쪽까지 글씨가 걸린다 → 중간을 더 덮는다. */
  collapsed: {
    colors: [
      "rgba(255,255,255,1)",
      "rgba(255,255,255,0.62)",
      "rgba(255,255,255,0)",
    ] as const,
    locations: [0.205, 0.578, 0.88] as const,
  },
};

/** 시안 기준 카드 높이(360x800 기준). 접으면 같은 그림의 위쪽만 남는다. */
export const SCENERY_CARD_HEIGHT = { expanded: 352, collapsed: 161 };

/**
 * 시간대 → 배경. 05~12시 아침, 12~18시 노을, 그 외 밤.
 *
 * 글자색은 세 시간대가 같다 — 흰 그라디언트가 글씨 얹히는 위쪽을 덮으므로
 * 밤 배경에서도 어두운 글씨가 그대로 읽힌다(시안 기준).
 *
 * Metro 는 대소문자를 구분한다 — 실제 파일명(back1.webp)과 정확히 일치시킬 것.
 *
 * 일러스트는 WebP(손실, q90)로 둔다 — 원본 PNG 는 장당 2.5MB 로 셋이 APK 의 7.5MB 를
 * 차지했고, 알파를 쓰지 않아 WebP 로 바꾸면 장당 200KB 이하로 줄어든다(화질 차이 없음).
 */
export const SCENERY_BACKGROUNDS: Record<SceneryTimeSlot, SceneryBackground> = {
  morning: {
    image: require("../../../assets/images/style/back1.webp"),
    fallback: "#CFE4F3",
    text: "#353535",
    subText: "#717171",
    head: "#5E84F4",
  },
  afternoon: {
    image: require("../../../assets/images/style/back2.webp"),
    fallback: "#F4D6BE",
    text: "#353535",
    subText: "#717171",
    head: "#5E84F4",
  },
  evening: {
    image: require("../../../assets/images/style/back3.webp"),
    fallback: "#1E2440",
    text: "#353535",
    subText: "#717171",
    head: "#5E84F4",
  },
};

/** 지금 시각이 속한 시간대. */
export function sceneryTimeSlot(now: Date): SceneryTimeSlot {
  const h = now.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "evening";
}
