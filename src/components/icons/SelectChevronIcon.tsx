import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

// 출발지/도착지/경유지 셀렉트 우측 펼침 표시용 작은 아래꺾쇠.
const SelectChevronIcon = ({ color = "#808080", ...props }: SvgProps) => (
  <Svg width={12} height={7} viewBox="0 0 12 7" fill="none" {...props}>
    <Path
      d="M0.577881 0.577637L5.57788 5.57764L10.5779 0.577637"
      stroke={color}
      strokeWidth={1.15556}
      strokeLinecap="round"
    />
  </Svg>
);

export default SelectChevronIcon;
