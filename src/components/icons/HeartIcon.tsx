import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

// 릴스 액션바 좋아요. Figma 원본 24×21.
// filled = 내가 좋아요를 누른 상태(채워진 하트).
type Props = SvgProps & { color?: string; filled?: boolean };

const HeartIcon = ({ color = "#FFFFFF", filled = false, ...props }: Props) => (
  <Svg width={24} height={21} viewBox="0 0 24 21" fill="none" {...props}>
    <Path
      d="M23.0133 6.12628C23.0133 7.53122 22.4804 8.94827 21.4025 10.0262L19.61 11.8187L11.8949 19.5338C11.8586 19.5701 11.8465 19.5822 11.8101 19.6064C11.7738 19.5822 11.7617 19.5701 11.7253 19.5338L2.21777 10.0262C1.13984 8.94827 0.606934 7.54333 0.606934 6.12628C0.606934 4.70923 1.13984 3.29218 2.21777 2.21425C4.37363 0.0705091 7.86175 0.0705091 10.0176 2.21425L11.798 4.00676L13.5905 2.21425C15.7464 0.0705091 19.2224 0.0705091 21.3782 2.21425C22.4804 3.29218 23.0133 4.69712 23.0133 6.12628Z"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth={1.21368}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default HeartIcon;
