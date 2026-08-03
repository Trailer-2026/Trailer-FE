import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

/** 내 정보 메뉴 '약관 및 정책' 문서 아이콘 (Figma 벡터). */
const TermsIcon = ({ color = "#5E5E5E", ...props }: SvgProps) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
    <Path
      d="M14.2832 17.6662H5.71654C4.76654 17.6662 3.99988 16.8996 3.99988 15.9496V3.95788C3.99988 3.00788 4.76654 2.24121 5.71654 2.24121H14.2832C15.2332 2.24121 15.9999 3.00788 15.9999 3.95788V15.9496C15.9916 16.8996 15.2249 17.6662 14.2832 17.6662Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.57458 5.7168H13.4246"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.57458 10H13.4246"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.57458 14.2832H13.4246"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default TermsIcon;
