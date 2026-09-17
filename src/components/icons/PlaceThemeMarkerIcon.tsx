import { Image } from "react-native";
import type { SvgProps } from "react-native-svg";

// 일정 결과 화면 타임라인 마커용 장소 분류 픽토그램. PNG 에셋 기반(base64 전사가
// 깨지는 문제 때문에 파일로 관리, HealingIcon 과 동일한 방식).
// 서버 themes 에는 카페/식당 구분이 없어(둘 다 FOOD) FOOD 는 식당 아이콘으로 통일한다.
export type PlaceMarkerCategory = "history" | "nature" | "food" | "default";

export const PLACE_MARKER_TINT: Record<PlaceMarkerCategory, string> = {
  history: "#C48CFF",
  nature: "#2EE32E",
  food: "#B0E6DB",
  default: "#FFFFFF",
};

export function placeMarkerCategory(themes: string[]): PlaceMarkerCategory {
  if (themes.includes("HISTORY")) return "history";
  if (themes.includes("NATURE")) return "nature";
  if (themes.includes("FOOD")) return "food";
  return "default";
}

const IMAGE_BY_CATEGORY: Record<PlaceMarkerCategory, number> = {
  food: require("../../../assets/images/style/place-marker-food.png"),
  nature: require("../../../assets/images/style/place-marker-nature.png"),
  history: require("../../../assets/images/style/place-marker-history.png"),
  default: require("../../../assets/images/style/place-marker-default.png"),
};

// 타임라인 노드(RailNode)가 그리는 원 안에 들어가는 장소 분류 픽토그램.
// 원(테두리+배경)은 RailNode 가 그리므로 여기서는 그림 부분만 렌더링한다.
const PlaceThemeMarkerIcon = ({
  category,
  width = 13,
  height = 13,
}: SvgProps & { category: PlaceMarkerCategory }) => (
  <Image
    source={IMAGE_BY_CATEGORY[category]}
    style={{ width: Number(width), height: Number(height) }}
    resizeMode="contain"
  />
);

export default PlaceThemeMarkerIcon;
