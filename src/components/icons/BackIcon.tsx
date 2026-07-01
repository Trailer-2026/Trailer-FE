import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

const BackIcon = ({ color = "#6E6E6E", ...props }: SvgProps) => (
  <Svg width={14} height={20} fill="none" {...props}>
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeWidth={1.571}
      d="m12.241.786-11 9.428 11 8.572"
    />
  </Svg>
);

export default BackIcon;
