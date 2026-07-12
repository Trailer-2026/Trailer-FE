import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

// "추천 다시받기" 버튼용 새로고침(양방향 화살표) 아이콘.
const RefreshIcon = ({ color = "#9D9D9D", ...props }: SvgProps) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" {...props}>
    <Path
      d="M4.04297 10.98L6.02297 9"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4.0425 10.98L2.0625 9"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.9575 7.33496L11.9775 9.31497"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.958 7.33496L15.938 9.31497"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.958 7.70996V11.8275C13.958 12.9975 13.0055 13.95 11.8355 13.95H6.16553"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4.04297 10.7325V6.16497C4.04297 4.99497 4.99547 4.04248 6.16547 4.04248H11.828"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default RefreshIcon;
