import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

const HomeIcon = ({ color = "#9D9D9D", ...props }: SvgProps) => (
  <Svg width={22} height={22} fill="none" {...props}>
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.344}
      d="M20.937 10.149v7.356c0 1.907-1.468 3.453-3.286 3.453H3.958c-1.818 0-3.286-1.546-3.286-3.453v-7.356c0-1.03.427-1.995 1.183-2.653l6.846-6.018a3.148 3.148 0 0 1 4.207 0l6.846 6.018a3.497 3.497 0 0 1 1.183 2.653Z"
    />
    {/* 문: 흰색으로 채워두면 어두운 탭바(릴스)에서 흰 문이 드러난다.
        투명으로 두면 어느 배경에서든 배경색이 그대로 비쳐 자연스럽다. */}
    <Path
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.344}
      d="M13.816 20.952H7.791v-6.57c0-.607.488-1.103 1.084-1.103h3.858c.596 0 1.083.496 1.083 1.104v6.57Z"
    />
  </Svg>
);

export default HomeIcon;
