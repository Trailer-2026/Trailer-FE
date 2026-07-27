import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

/** 내 정보 메뉴 '버전 정보' 아이콘 (Figma 벡터). 가운데 점만 fill. */
const InfoIcon = ({ color = "#5E5E5E", ...props }: SvgProps) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
    <Path
      d="M10.0001 9.16699V13.0503"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.0001 7.56738C10.3453 7.56738 10.6251 7.28756 10.6251 6.94238C10.6251 6.5972 10.3453 6.31738 10.0001 6.31738C9.65494 6.31738 9.37512 6.5972 9.37512 6.94238C9.37512 7.28756 9.65494 7.56738 10.0001 7.56738Z"
      fill={color}
    />
    <Path
      d="M9.99996 17.7087C14.2572 17.7087 17.7083 14.2575 17.7083 10.0003C17.7083 5.74313 14.2572 2.29199 9.99996 2.29199C5.74276 2.29199 2.29163 5.74313 2.29163 10.0003C2.29163 14.2575 5.74276 17.7087 9.99996 17.7087Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default InfoIcon;
