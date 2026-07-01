import * as React from "react";
import Svg, {
  Defs,
  Image,
  Path,
  Pattern,
  type SvgProps,
  Use,
} from "react-native-svg";

const SubwayIcon = (props: SvgProps) => (
  <Svg width={39} height={39} fill="none" {...props}>
    <Path fill="url(#subwayPattern)" fillOpacity={0.52} d="M0 0h39v39H0z" />
    <Defs>
      <Pattern
        id="subwayPattern"
        width={1}
        height={1}
        patternContentUnits="objectBoundingBox"
      >
        <Use xlinkHref="#subwayImg" transform="scale(.01)" />
      </Pattern>
      <Image
        xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAADd0lEQVR4nO2dy6tOURiHn4lDyaV0EIUMkC1yGYqM3JOBEf8BRfEHnKRQLqUMGMotko6TERMUmSqFEnIZoFyLco6lpWVA9rE237f2u5bfU7/ZaX3vco999t7rO6e1QAghhBBCCCHKZAKwBegDjgPnMsnxUPPmMIfsWQFcBQYBl3m+AFeA5WTIZOCygSa6LuUSMJFMmA88NtA01+U8A5ZgnNnAGwPNconyDpiLUcYD9w00ySXOPWAcBjlsoDmupRzAGDOAzwYa41rKJ2A6htjT4QneTbDGuNvhmndjiE5Pri9BzX0drvkORpjUhVtAX4ZCnJW1iX8XlxC+ZxEGWNeFiR0DFnc5x7pQt+9F62zqwsRcpvG9aB0JQUKc0UgItiIh2IqEYCsSgq1ICLaSjZBOL+o2RTan059bjJBOU0V8pv+ZTiMhNUjIMEgIElJJSD0SgoRUElKPhCAhlYTUIyFISCUh9UgIElJJSD0SgoRUElKPhCAhlYTUIyFISCUh9UgIElJJSD36rxMkxBmNhGArEoKtSAi2IiHYioRgKxKCrUgItiIh2IqEYCsSgq1kKWQIuAkcAfYDp4FXBpr5EjgVavK13Qq1Fi3kWs23sD3AjrDvVGoR/jO3hxp+ZR5wo1QhF4ERfxhrWeKN0LyMpX+oyYvqL03IU2B05Hg7EwrxvxkxjAGelyTE345i6QFeJ3pm/O429S8XSjZCZjUc80wCIf4B3oQ5JQkZ1XDMfQmE7G1Y06iShDTdyP5oAiH+1bYJvbkIidlRbmXDMW8nEOLXGU1YncuOcjF7LvptWWNZAHxNIGQorDNiuRAxpt/toXWmRBTqG7wmYqyesIp3iXI98k1rfeRF4k+FMMGDiGLfA2uHGWMsMJBQxo/0h3XGcDI+RIzj9703w6HIyfur7DywKjwkR4bXyV3AixZk/MjzsM6YE2rqDc+MCw1unwcxxIK/+CKupAyFc1NMcdZAY1xLOYlBZgJvDTTHJc6bcDqESdb/Z7eur8BGjLPtP5EyCGwlE/xV89FA01yX4ue2gcyYCpxItOp2CTNg+ZkRw6KwTon5A48zfESen8NCCqM3HGOaw8mfg6FWX3OxTAMeGmi2i8yT8DpfJLnJcCVLyVWGK1XKIwNNdf8YP4dicIWkGNpupJOQn2m7kU5CfuZcIRFCCCGEEEIISuMbPxS6kv45nZUAAAAASUVORK5CYII="
        id="subwayImg"
        width={100}
        height={100}
        preserveAspectRatio="none"
      />
    </Defs>
  </Svg>
);

export default SubwayIcon;
