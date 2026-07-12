import * as React from "react";
import Svg, {
  Path,
  Defs,
  Pattern,
  Use,
  Image,
  type SvgProps,
} from "react-native-svg";

const HistoryIcon = (props: SvgProps) => (
  <Svg width={25} height={25} fill="none" {...props}>
    <Path fill="url(#his_a)" d="M0 0h25v25H0z" />
    <Defs>
      <Pattern
        id="his_a"
        width={1}
        height={1}
        patternContentUnits="objectBoundingBox"
      >
        <Use xlinkHref="#his_b" transform="scale(.01)" />
      </Pattern>
      <Image
        xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEi0lEQVR4nO2aP2wbVRzHLdssiBHYWVjYmBALjAyk6tINATMzO2WpIgYoUAlMl5QK5c75c0nUVimQurXTvLPvVbYaxxeDS52aBsdW64Yz6tQ+9LPw9b24kDufY9+V70f6Svb9nt+f3ycXO1ZiMQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAosNzWvf1uN79OK45y3HdKSQ0Z4dCj+O6s0Q1GjPpfT7bZEQyrnXfj+tOKaF3hZfENacY1533YmmRmPT2I4XN2ee2xbb6qXD2kTIg/fCVuN7NehUxIEZ3zNjs/qvylLSGvCbtYdznDi0VzuZsbgo3FjvZryVmnbcTutMdVoYbresk03++1Z+X1pDXpD1MrAFREZKc3X9zJDLcON2k9tcbNDeE+BWyIp5P6N3a6GS4Um7H0nsvhFqIbbFTFc7SfmMX2LGA6578Z66G0hxrY2tuvVQ5fbUijiLz10tbtMYBIY3emaRfl0OdqcCODdVLi516MglnHyo/oV5isW6tdP3lIJuvcDPje11+tKE9BTnTNucv2pbp+F83/4E7SSaTSVY42/c3CZsJsvFRCakWLbFTrfRCjycthKDe+FuT7ZMDtTmW2fJ5h5yZlJBqsSDq22XRvFMX91tN0WnvuWn9vhNIzkiEWOyMrzUtszXYnJALqf6HhH/LMHIgZMQSOgHlQMgRSugMIQdCxiSh41FOeIRw84G/SdjqNs+fCJK6XW7sNXZEZ8wSOk9LqyloL7SnoOei3vjqJTcfDAqxzEe+7pARpCdj0iLaamhP4+4D9R5C2hACITzkQhq/bou7v9XctHcbSnOajbq4bW+6adSqSv3+3h9KnULX5DH0GrlOc8p1WlPeA+3pfyskuzQnLsyk3NgWU5pVvPazODf9iZuL51IDwuQ65WDD6TVyneaU67SmvAfaUyiFlPProsxybrYKG8ok9Fyu03h1IabWWa53LXpC2KHnCNorT0KM1JfKQa4ZujIJPZfrNF6u39zIDjSLrkVNyE0P5wjaKwhpQwiETEOIeKaE4E3dDNeb+jgSDSHmkQdC2hACIRxCBIRAiICQaQiBED4RIUysX1gUP2nfixuZH586EV2nOo07+NmcUjZzYm3+h17ocVSFlA85R9BeeRJydVFzD3H+s09FMXdFmaSUvdK73h+TWdQGNrHwzRduffHb05EVsnDIOYL2ypOQpbNfKwfJLs+rzVyeV+o0Xq5vmrmBZtG1qAnZ9HCOoL3Cd1ntCH6XBSEmhNgQ8gSbs4cQkpqIEOr94B3CWRtCUpO5QzhrHyrk8uyMML77ys3G6ooyCT2X6zRertMnEblOOfjpxFpbFbmVBTe1zZLarBt5cen8WTfrFw2l3rp7R6lT6Jo8hl4j12lOuU5rynugPfk9R9BeeRIyjuAf5UwI6UAIhNh+hLyTPvESJZ9f+6WQX7s3zuzWbz2+19wVYcpu/dbjcfeBet/3EHvXOC6Q46EJhBjhCoQY4QqEGOEKhBjhCoQY4UpsannqNWQqNBn4AxEAAAAAAAAAAAAAAAAAAAAAAAAAMeJvnrcvkYpMMf0AAAAASUVORK5CYII="
        id="his_b"
        width={100}
        height={100}
        preserveAspectRatio="none"
      />
    </Defs>
  </Svg>
);

export default HistoryIcon;
