import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

/**
 * 하단탭 재생(피드) 아이콘.
 * filled=true 면 사각형이 color 로 꽉 차고 재생 삼각형이 holeColor 로 뚫린 것처럼 보인다.
 * (릴스 탭 활성 시 — 어두운 탭바 위 흰색 아이콘)
 * holeColor 는 탭바 배경색과 맞춰야 파인 것처럼 보인다.
 */
type Props = SvgProps & {
  color?: string;
  filled?: boolean;
  holeColor?: string;
};

const PlayIcon = ({
  color = "#9D9D9D",
  filled = false,
  holeColor = "#0D0D0D",
  ...props
}: Props) => (
  <Svg width={22} height={22} fill="none" {...props}>
    <Path
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth={1.45277}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.2582 0.726379H4.18415C2.27167 0.726379 0.726562 2.36253 0.726562 4.3877V17.0651C0.726562 19.0902 2.27167 20.7264 4.18415 20.7264H17.269C19.1814 20.7264 20.7266 19.0902 20.7266 17.0651V4.3877C20.7158 2.36253 19.1706 0.726379 17.2582 0.726379Z"
    />
    <Path
      fill={filled ? holeColor : "none"}
      stroke={filled ? holeColor : color}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.3067 10.0508L7.85776 6.81019C7.34464 6.553 6.72656 6.91878 6.72656 7.4846V13.9658C6.72656 14.5317 7.33881 14.9032 7.85776 14.6403L14.3067 11.3996C14.8665 11.1196 14.8665 10.3309 14.3067 10.0508Z"
    />
  </Svg>
);

export default PlayIcon;
