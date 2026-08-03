import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

/** 내 정보 메뉴 '계정 비활성화' 아이콘 (Figma 벡터). */
const LogoutIcon = ({ color = "#5E5E5E", ...props }: SvgProps) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
    <Path
      d="M10.0001 2.29155H15.1001C15.7606 2.2621 16.4058 2.49546 16.8946 2.94055C17.3834 3.38565 17.6761 4.00624 17.7085 4.66654V15.3332C17.6761 15.9935 17.3834 16.6141 16.8946 17.0592C16.4058 17.5043 15.7606 17.7377 15.1001 17.7082H10.0001"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2.29175 10H12.5001"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.5001 10.0003L9.16675 6.66699"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.5001 10L9.16675 13.3333"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default LogoutIcon;
