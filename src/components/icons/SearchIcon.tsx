import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

const SearchIcon = ({ color = "#000000", ...props }: SvgProps) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
    <Path
      d="M9.1415 15.9915C5.35817 15.9915 2.2915 12.9248 2.2915 9.1415C2.2915 5.35817 5.35817 2.2915 9.1415 2.2915C12.9248 2.2915 15.9915 5.35817 15.9915 9.1415C15.9915 12.9248 12.9248 15.9915 9.1415 15.9915Z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17.7077 17.7077L14.2827 14.2827"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default SearchIcon;
