import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

// "다른 테마" 왼쪽 새로고침(순환 화살표) 아이콘.
const ThemeSwapIcon = ({ color = "#5E84F4", ...props }: SvgProps) => (
  <Svg width={13} height={13} viewBox="0 0 13 13" fill="none" {...props}>
    <Path
      d="M6.12085 4.44141L7.42085 5.79557"
      stroke={color}
      strokeWidth={0.8125}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.12085 4.4416L7.42085 3.1416"
      stroke={color}
      strokeWidth={0.8125}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.50002 4.44141H8.82919C10.3459 4.44141 11.5375 5.63307 11.5375 7.14974C11.5375 8.66641 10.3459 9.85807 8.82919 9.85807H4.17086C2.65419 9.85807 1.46252 8.66641 1.46252 7.14974C1.46252 5.63307 2.65419 4.44141 4.17086 4.44141"
      stroke={color}
      strokeWidth={0.8125}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default ThemeSwapIcon;
