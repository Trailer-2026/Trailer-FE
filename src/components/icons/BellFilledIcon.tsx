import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

/**
 * 채워진 종 아이콘 — 풍경알림 카드 헤더용.
 *
 * 하단 탭바의 BellIcon 은 선(stroke)만 있는 버전이라 별도로 둔다.
 * 이쪽은 면을 색으로 채우고 흰 테두리를 둘러 분홍 카드 위에서 또렷하게 보이게 한다.
 */
const BellFilledIcon = ({
  color = "#668DFF",
  /** 테두리 색 — 카드 배경이 밝을 때 흰색이 기본. */
  strokeColor = "#FFFFFF",
  ...props
}: SvgProps & { strokeColor?: string }) => (
  <Svg width={20} height={22} viewBox="0 0 20 22" fill="none" {...props}>
    <Path
      d="M19.0342 15.7166C19.0342 16.6491 18.2563 17.4062 17.298 17.4062H2.23618C1.2779 17.4062 0.5 16.6491 0.5 15.7166C0.5 14.784 1.2779 14.027 2.23618 14.027H2.81112V8.38759C2.81112 4.65727 5.92272 1.61816 9.7671 1.61816C11.6837 1.61816 13.4198 2.3752 14.6825 3.60401C15.9451 4.82185 16.7231 6.51146 16.7231 8.38759V14.027H17.298C18.2563 14.027 19.0342 14.784 19.0342 15.7166Z"
      fill={color}
      stroke={strokeColor}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.7666 1.62982V0.5"
      stroke={strokeColor}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.2386 17.418C13.2386 19.2941 11.6828 20.7972 9.76627 20.7972C7.84972 20.7972 6.29395 19.2831 6.29395 17.418H13.2386Z"
      fill={color}
      stroke={strokeColor}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default BellFilledIcon;
