import * as React from "react";
import type { SvgProps } from "react-native-svg";

import BackIcon from "./BackIcon";

/**
 * BackIcon(<)을 좌우반전한 오른쪽 방향 chevron (>).
 * 리스트 행 이동 표시 등 5번째 탭의 모든 > 를 이 아이콘으로 통일한다.
 */
const ForwardIcon = ({ style, ...props }: SvgProps) => (
  <BackIcon {...props} style={[{ transform: [{ scaleX: -1 }] }, style]} />
);

export default ForwardIcon;
