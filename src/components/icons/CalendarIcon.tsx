import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

const CalendarIcon = (props: SvgProps) => (
  <Svg width={21} height={21} fill="none" {...props}>
    <Path
      stroke="#393939"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4.819 2.865V.75M15.371 2.865V.75"
    />
    <Path
      stroke="#393939"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.2}
      d="M16.305 1.808H3.885A3.281 3.281 0 0 0 .6 5.092v11.374a3.281 3.281 0 0 0 3.285 3.284h12.43a3.281 3.281 0 0 0 3.285-3.284V5.092a3.297 3.297 0 0 0-3.295-3.284ZM.6 6.037h18.99"
    />
  </Svg>
);

export default CalendarIcon;
