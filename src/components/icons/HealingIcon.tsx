import { Image } from "react-native";
import type { SvgProps } from "react-native-svg";

// PNG 에셋 기반 아이콘. base64 전사가 계속 깨져 파일로 대체.
// (Metro 는 에셋 require 에 상대경로 사용 — @/ 별칭 X)
const HEALING = require("../../../assets/images/style/healing.png");

const HealingIcon = ({ width = 24, height = 24 }: SvgProps) => (
  <Image
    source={HEALING}
    style={{ width: Number(width), height: Number(height) }}
    resizeMode="contain"
  />
);

export default HealingIcon;
