import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

// color 미지정 시 기존 다크 그레이 유지(밝은 배경용). 릴스처럼 어두운 배경에선 흰색을 넘긴다.
type Props = SvgProps & { color?: string };

const AddCircleIcon = ({ color = "#353535", ...props }: Props) => (
  <Svg width={30} height={30} fill="none" {...props}>
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.2}
      d="M7.51 21.76c-4.149-4.15-4.321-10.7-.385-14.635C11.06 3.189 17.61 3.36 21.759 7.51c4.149 4.149 4.321 10.699.386 14.635-3.936 3.935-10.486 3.763-14.635-.386ZM19.623 14.9 10 14.723M14.723 10l.177 9.623"
    />
  </Svg>
);

export default AddCircleIcon;
