import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

/** 프로필 사진 편집 배지용 연필 아이콘 (Figma 벡터). 회색 몸통 + 흰색 하이라이트 선. */
const EditPencilIcon = ({ width = 14, height = 14, ...props }: SvgProps) => (
  <Svg width={width} height={height} viewBox="0 0 14 14" fill="none" {...props}>
    <Path
      d="M3.05889 12.989L12.9645 3.05851L10.4864 0.574219L0.580791 10.5047L0.574097 12.9957L3.05889 12.989Z"
      fill="#8C8C8C"
      stroke="#8C8C8C"
      strokeWidth={1.14815}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.01306 2.84375L10.7008 4.53575"
      stroke="white"
      strokeWidth={1.14815}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default EditPencilIcon;
