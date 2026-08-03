import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

// 릴스 액션바 공유(노드 3개를 선으로 이은 형태). Figma 원본 27×28.
type Props = SvgProps & { color?: string };

const ShareIcon = ({ color = "#FFFFFF", ...props }: Props) => (
  <Svg width={27} height={28} viewBox="0 0 27 28" fill="none" {...props}>
    <Path
      d="M7.86392 15.8307C9.15627 15.8307 10.2039 14.8094 10.2039 13.5496C10.2039 12.2898 9.15627 11.2686 7.86392 11.2686C6.57157 11.2686 5.52393 12.2898 5.52393 13.5496C5.52393 14.8094 6.57157 15.8307 7.86392 15.8307Z"
      stroke={color}
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.2041 7.90487C20.4592 7.90487 21.4766 6.88361 21.4766 5.62382C21.4766 4.36402 20.4592 3.34277 19.2041 3.34277C17.9491 3.34277 16.9316 4.36402 16.9316 5.62382C16.9316 6.88361 17.9491 7.90487 19.2041 7.90487Z"
      stroke={color}
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.2041 23.7594C20.4592 23.7594 21.4766 22.7381 21.4766 21.4783C21.4766 20.2185 20.4592 19.1973 19.2041 19.1973C17.9491 19.1973 16.9316 20.2185 16.9316 21.4783C16.9316 22.7381 17.9491 23.7594 19.2041 23.7594Z"
      stroke={color}
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.3838 11.7898L16.6838 7.38574"
      stroke={color}
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16.6838 19.7165L10.3838 15.3125"
      stroke={color}
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default ShareIcon;
