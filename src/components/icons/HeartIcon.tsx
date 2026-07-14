import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

// 릴스 액션바 좋아요. filled = 내가 좋아요를 누른 상태(채워진 하트).
type Props = SvgProps & { color?: string; filled?: boolean };

const HeartIcon = ({ color = "#FFFFFF", filled = false, ...props }: Props) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M12 20.7 3.75 12.45a5.4 5.4 0 0 1 0-7.64 5.4 5.4 0 0 1 7.64 0l.61.61.61-.61a5.4 5.4 0 0 1 7.64 0 5.4 5.4 0 0 1 0 7.64L12 20.7Z"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default HeartIcon;
