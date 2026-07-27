import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

/** 내 정보 메뉴 '북마크' 아이콘 (Figma 벡터). */
const BookmarkIcon = ({ color = "#5E5E5E", ...props }: SvgProps) => (
  <Svg width={11} height={16} viewBox="0 0 11 16" fill="none" {...props}>
    <Path
      d="M9.17195 15.0999C8.11595 14.1559 7.06796 13.1639 6.01197 12.2519C5.71597 11.9959 5.27596 11.9959 4.97997 12.2519C3.93197 13.1559 2.88398 14.1479 1.83599 15.0919C1.32399 15.5559 0.5 15.1879 0.5 14.4919V2.09999C0.5 1.22 1.22 0.5 2.09999 0.5H8.89995C9.77995 0.5 10.4999 1.22 10.4999 2.09999V14.4919C10.5079 15.1959 9.69194 15.5639 9.17195 15.0999Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default BookmarkIcon;
