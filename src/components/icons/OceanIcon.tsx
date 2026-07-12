import * as React from "react";
import Svg, {
  Path,
  Defs,
  Pattern,
  Use,
  Image,
  type SvgProps,
} from "react-native-svg";

const OceanIcon = (props: SvgProps) => (
  <Svg width={25} height={25} fill="none" {...props}>
    <Path fill="url(#ocn_a)" d="M0 0h25v25H0z" />
    <Defs>
      <Pattern
        id="ocn_a"
        width={1}
        height={1}
        patternContentUnits="objectBoundingBox"
      >
        <Use xlinkHref="#ocn_b" transform="scale(.01)" />
      </Pattern>
      <Image
        xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAADeklEQVR4nO2ZO2gUURSGg/jC1korTyKyakRBLXxVBrTQUsTCRgULtfGFYGGnIjF31sDExLf4gCjGRgslpNEk92attLITrex0djN3gnjkZBWTsNHsTpI9Gf4PPliyO3fuud/sNmloAAAAAAAAAAAAAAAAAAAAAAAAAMCMcKGP59d7jQvM88R67mG61ki3gQ+8MLDJ6/ygX1PrGsYmG4xNXnUWeEHta/jzxvkzc32OVNzp48WBS3oCl7CxyadrBZ+rdo3AJc3G+q+/13ia/8iLql5jKD5urP9pnP9hXHJors6RirbBkR2B8x9kA3/139tcfEyetv9dL5/J2/iEsT4au4ax/n3b0Mi2qeyh/V1pubH+/vg9JGycv9tWKC6bK3NUjXwFZcDAjWzOO3/aWP924iFM8Etgkyt5G+82A/GKzgIvEeW1/E3eG/3Mv9aw/k1g/Sm5p9xb9tBueakZ8KvzLjlonH9orPeTXV9+zz+Qz8oTL9dqmSN1kMAl3f/ZOHRTthtBXMaCXB3yrxUMwllQzjJ1kNZC8rnegwQZUc5yxoPselziy/21b/JSf3mNNIMefjHMR14Mp1pjNuaY8SB7uotMYcTNN4vcOljDEzOYcPON8hp7n9R2oCd7Y27qiLgpjPh0b1zTGrM1x4wFuTKQ8JZ7pdEN/DHXWeSzvVMfQg4v11Ue4o9b75eqOpD9PSVuHHO9vD7wfOrfttmeY9qDyEZ3PhoedwgT3XSnyEdfxtxa6Qlxyeh7G2+PH2CsTR1FbnlU4nN9lQ/gYn/M+3qGOdc5+R5yXRHve1bii28rf2PqNce0BNn+IIpXXS+O/ixMdvNKNnZEvOp6xGu6ysrrxirXaOoostxbfg4kwMoqrxflGrlW1qj3HHKWqYOsvRH9qPYQYFRROUsECfWIIKEuESTUJYKEukSQUJcIEmYwyPpb0bd6D0IZUc4ydRAKo+56D0LZMf3/QxAkQhDKrghCukQQ0iWCkC4RhHSJIKRLBCFdIgjpEkFIlwhCukQQ0iWCkC4RhHSJIKRLBCFdIgjpEkFIlwhCukQQ0iWCkC4RhHSJIKRLBCFdIgjpEkFIlwhCukQQ0iWCkC4RhHSJIKRLBCFdIgjpEkFIlwhCukQQ0iWCkC4RhLIWpLE9Wkdh1AKj1MpZpg4CAAAAAAAAAAAAAAAAAAAAAGjILr8A233V0o+z6aEAAAAASUVORK5CYII="
        id="ocn_b"
        width={100}
        height={100}
        preserveAspectRatio="none"
      />
    </Defs>
  </Svg>
);

export default OceanIcon;
