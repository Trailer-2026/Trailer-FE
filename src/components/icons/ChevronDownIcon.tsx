import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

const ChevronDownIcon = ({ color = "#808080", ...props }: SvgProps) => (
  <Svg width={20} height={11} viewBox="0 0 20 11" fill="none" {...props}>
    <Path
      d="M0.649902 0.649902L9.6499 9.6499L18.6499 0.649902"
      stroke={color}
      strokeWidth={1.3}
      strokeLinecap="round"
    />
  </Svg>
);

export default ChevronDownIcon;
