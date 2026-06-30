import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

// 디자인 기준 해상도(360 x 800). 이 값을 기준으로 실제 단말
// 화면 크기 비율만큼 스케일링한다.
const GUIDELINE_BASE_WIDTH = 360;
const GUIDELINE_BASE_HEIGHT = 800;

/** 가로 기준 스케일 (너비/가로 마진·패딩) */
export const scale = (size: number) => (width / GUIDELINE_BASE_WIDTH) * size;

/** 세로 기준 스케일 (높이/세로 마진·패딩) */
export const verticalScale = (size: number) =>
  (height / GUIDELINE_BASE_HEIGHT) * size;

/**
 * 완만한 스케일 (폰트·아이콘 등). factor가 0이면 원본, 1이면 scale()과 동일.
 * 화면 크기 차이를 과하게 반영하지 않도록 기본 0.5로 완화합니다.
 */
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;
