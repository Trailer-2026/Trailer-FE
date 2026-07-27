import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

/** 내 정보 메뉴 '알림 설정' 종 아이콘 (Figma 벡터). 하단바 BellIcon 과는 다른 도안. */
const AlarmIcon = ({ color = "#5E5E5E", ...props }: SvgProps) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
    <Path
      d="M16.8497 13.8509C16.8497 14.5592 16.2747 15.1342 15.5663 15.1342H4.433C3.72467 15.1342 3.14966 14.5592 3.14966 13.8509C3.14966 13.1426 3.72467 12.5676 4.433 12.5676H4.85798V8.28424C4.85798 5.45091 7.15799 3.14258 9.99966 3.14258C11.4163 3.14258 12.6996 3.71758 13.633 4.65091C14.5663 5.57591 15.1413 6.85924 15.1413 8.28424V12.5676H15.5663C16.2747 12.5676 16.8497 13.1426 16.8497 13.8509Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.99988 3.15032V2.29199"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.5664 15.1426C12.5664 16.5676 11.4164 17.7092 9.99976 17.7092C8.58309 17.7092 7.43311 16.5592 7.43311 15.1426H12.5664Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default AlarmIcon;
