import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

/** 내 영상 ⋯ 메뉴의 삭제 아이콘. Figma 원본 18×20(획 아이콘). */
type Props = SvgProps & { color?: string };

const TrashIcon = ({ color = "#353535", ...props }: Props) => (
  <Svg width={18} height={20} viewBox="0 0 18 20" fill="none" {...props}>
    <Path
      d="M14.9955 3.74579H2.53817V17.3098C2.53817 18.457 3.47222 19.3911 4.61948 19.3911H12.9041C14.0513 19.3911 14.9854 18.457 14.9854 17.3098V3.74579H14.9955Z"
      stroke={color}
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M0.60926 3.74579H17.28"
      stroke={color}
      strokeWidth={1.21832}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.0715 0.608765H5.81747V3.73579H12.0715V0.608765Z"
      stroke={color}
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.85306 7.72556V15.2284"
      stroke={color}
      strokeWidth={1.21832}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11.0259 7.72556V15.2284"
      stroke={color}
      strokeWidth={1.21832}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default TrashIcon;
