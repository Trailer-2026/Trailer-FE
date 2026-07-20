import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

// 릴스 상단 헤더 공유(위로 내보내기). Figma 원본 20×21.
type Props = SvgProps & { color?: string };

const ShareUpIcon = ({ color = "#FFFFFF", ...props }: Props) => (
  <Svg width={20} height={21} viewBox="0 0 20 21" fill="none" {...props}>
    <Path
      d="M19.2529 10.0352L19.2529 16.1782C19.2882 16.9737 19.0082 17.7509 18.4741 18.3397C17.94 18.9285 17.1952 19.2809 16.4029 19.32L3.60288 19.32C2.81051 19.2809 2.0658 18.9285 1.53169 18.3397C0.997574 17.7509 0.717549 16.9737 0.75288 16.1782L0.75288 10.0352"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.0029 13.0463L10.0029 0.780273"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.0029 0.75L6.00293 4.76506"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.0029 0.75L14.0029 4.76506"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default ShareUpIcon;
