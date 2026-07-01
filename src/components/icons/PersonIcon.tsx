import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

const PersonIcon = ({ color = "#9D9D9D", ...props }: SvgProps) => (
  <Svg width={19} height={21} fill="none" {...props}>
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.462}
      d="M9.068 8.731c2.279 0 4.126-1.79 4.126-4 0-2.209-1.847-4-4.126-4-2.278 0-4.125 1.791-4.125 4 0 2.21 1.847 4 4.125 4ZM.731 19.846v-2.28c0-2.662 2.225-4.805 4.956-4.805h7.42c2.747 0 4.957 2.156 4.957 4.805v2.28"
    />
  </Svg>
);

export default PersonIcon;
