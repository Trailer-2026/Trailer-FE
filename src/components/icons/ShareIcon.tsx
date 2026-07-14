import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

// 공유(종이비행기). 릴스 액션바 + 상단 헤더 공용.
type Props = SvgProps & { color?: string };

const ShareIcon = ({ color = "#FFFFFF", ...props }: Props) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M21.5 2.5 11 13M21.5 2.5l-6.7 19.1a.4.4 0 0 1-.75.02L10.9 13.1 2.38 9.95a.4.4 0 0 1 .02-.75L21.5 2.5Z"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default ShareIcon;
