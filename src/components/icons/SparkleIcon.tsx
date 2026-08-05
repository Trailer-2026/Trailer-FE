import * as React from "react";
import Svg, {
  Defs,
  Image,
  Pattern,
  Rect,
  type SvgProps,
  Use,
} from "react-native-svg";

/** '일정 만들기' 시트의 AI 추천 아이콘(Figma 30x30). */
const SparkleIcon = (props: SvgProps) => (
  <Svg width={30} height={30} viewBox="0 0 30 30" fill="none" {...props}>
    <Rect width={30} height={30} fill="url(#sparklePattern)" />
    <Defs>
      <Pattern
        id="sparklePattern"
        width={1}
        height={1}
        patternContentUnits="objectBoundingBox"
      >
        <Use xlinkHref="#sparkleImg" transform="scale(.01)" />
      </Pattern>
      <Image
        xlinkHref="data:image/png;base64,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"
        id="sparkleImg"
        width={100}
        height={100}
        preserveAspectRatio="none"
      />
    </Defs>
  </Svg>
);

export default SparkleIcon;
