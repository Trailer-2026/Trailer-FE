import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

const BellIcon = ({ color = "#9D9D9D", ...props }: SvgProps) => (
  <Svg width={20} height={22} fill="none" {...props}>
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.283}
      d="M18.642 15.636c0 .919-.756 1.665-1.686 1.665H2.328c-.93 0-1.686-.746-1.686-1.665 0-.92.755-1.665 1.686-1.665h.558V8.414c0-3.676 3.022-6.67 6.756-6.67 1.86 0 3.547.746 4.773 1.956a6.564 6.564 0 0 1 1.982 4.714v5.557h.559c.93 0 1.686.746 1.686 1.665ZM9.641 1.755V.642M13.013 17.312c0 1.848-1.511 3.33-3.373 3.33-1.861 0-3.372-1.492-3.372-3.33h6.745Z"
    />
  </Svg>
);

export default BellIcon;
