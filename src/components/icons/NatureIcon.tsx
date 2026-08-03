import * as React from "react";
import Svg, {
  Path,
  Defs,
  Pattern,
  Use,
  Image,
  type SvgProps,
} from "react-native-svg";

const NatureIcon = (props: SvgProps) => (
  <Svg width={25} height={25} fill="none" {...props}>
    <Path fill="url(#nat_a)" d="M0 0h25v25H0z" />
    <Defs>
      <Pattern
        id="nat_a"
        width={1}
        height={1}
        patternContentUnits="objectBoundingBox"
      >
        <Use xlinkHref="#nat_b" transform="scale(.01)" />
      </Pattern>
      <Image
        xlinkHref="data:image/png;base64,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"
        id="nat_b"
        width={100}
        height={100}
        preserveAspectRatio="none"
      />
    </Defs>
  </Svg>
);

export default NatureIcon;
