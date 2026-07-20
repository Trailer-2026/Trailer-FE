import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

// 릴스 액션바 댓글(둥근 말풍선). Figma 원본 23×23.
type Props = SvgProps & { color?: string };

const CommentIcon = ({ color = "#FFFFFF", ...props }: Props) => (
  <Svg width={23} height={23} viewBox="0 0 23 23" fill="none" {...props}>
    <Path
      d="M20.5512 15.3316H20.5399C21.1249 14.0266 21.4624 12.5754 21.4624 11.0566C21.4624 5.30789 16.8049 0.650391 11.0562 0.650391C5.3074 0.650391 0.649902 5.30789 0.649902 11.0566C0.649902 16.8054 5.3074 21.4629 11.0562 21.4629C12.7549 21.4629 14.3636 21.0466 15.7811 20.3266L21.4061 21.1591L20.5512 15.3316Z"
      stroke={color}
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default CommentIcon;
