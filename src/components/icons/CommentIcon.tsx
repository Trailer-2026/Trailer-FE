import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

// 릴스 액션바 댓글(말풍선).
type Props = SvgProps & { color?: string };

const CommentIcon = ({ color = "#FFFFFF", ...props }: Props) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M20 4.5H4a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 16.5h3v4l5-4h8a1.5 1.5 0 0 0 1.5-1.5V6A1.5 1.5 0 0 0 20 4.5Z"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default CommentIcon;
