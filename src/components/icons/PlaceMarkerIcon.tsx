import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

// 다크 타임라인 장소(방문) 노드용 위치 마커. Figma 원본 9×12.
// color = 핀 색, dotFill = 중앙 구멍 색(노드 배경과 맞춰 뚫린 것처럼).
type Props = SvgProps & { color?: string; dotFill?: string };

const PlaceMarkerIcon = ({
  color = "#B0E6DB",
  dotFill = "#262626",
  ...props
}: Props) => (
  <Svg width={9} height={12} viewBox="0 0 9 12" fill="none" {...props}>
    <Path
      d="M4.28076 0.431152C2.1606 0.431152 0.431152 2.1606 0.431152 4.28076C0.431152 6.91229 3.87857 10.7849 4.02221 10.9458C4.1601 11.1009 4.40142 11.1009 4.53932 10.9458C4.6887 10.7849 8.13037 6.91229 8.13037 4.28076C8.13037 2.1606 6.40092 0.431152 4.28076 0.431152Z"
      fill={color}
      stroke={color}
      strokeWidth={0.861853}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4.50099 5.62211C5.24373 5.50389 5.74999 4.80593 5.63177 4.0632C5.51355 3.32046 4.8156 2.8142 4.07287 2.93242C3.33013 3.05065 2.82387 3.74859 2.94209 4.49132C3.06031 5.23406 3.75826 5.74033 4.50099 5.62211Z"
      fill={dotFill}
      stroke={color}
      strokeWidth={0.861853}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default PlaceMarkerIcon;
