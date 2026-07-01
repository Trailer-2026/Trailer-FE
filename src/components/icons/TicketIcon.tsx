import * as React from "react";
import Svg, {
  Defs,
  Image,
  Path,
  Pattern,
  type SvgProps,
  Use,
} from "react-native-svg";

const TicketIcon = (props: SvgProps) => (
  <Svg width={37} height={37} fill="none" {...props}>
    <Path fill="url(#ticketPattern)" fillOpacity={0.52} d="M0 0h37v37H0z" />
    <Defs>
      <Pattern
        id="ticketPattern"
        width={1}
        height={1}
        patternContentUnits="objectBoundingBox"
      >
        <Use xlinkHref="#ticketImg" transform="scale(.01)" />
      </Pattern>
      <Image
        xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAADgklEQVR4nO2cOYgUQRSGP0yEFe/MxBt0Dw3MxGAVPBBkU4/IAzVRM3GNVsQbFMTE2EUXFFY0EMErXxVvhV0FV1TU9QIFDfRJQS0Myww4Pd09r2f+D/60i/r/nu43VdUPhBBCCCGEEEIIIYQQQgghhBBCCJEWU4FWYEnBNaPC/CamdP3g0RQyYgKwH3gBWIOop8JcO1Me5znQDbSkFUYH8MqBgVbQQEb1EmivNYxZwEcH5lkDBBI0AsytJZA7DoyzBgok6FbSMJY5MM0y1NkK896Yw9hLkwRywoFplqHeAJPKzPtqDmMfSxLIZQemWQ6Pj3kl5fyZnMbtTxLIbQeGWU76DPzNcbzgrQLBjxQIvqRA8CUFgi8pEHxJgVBef4BzwC7gJPDdcyDXHRhmGSqUuevGzHl2XG/KeuzgbdUcdmCaZahrFea9L4exDyUJZBow6MA4y0jhhivHqozHHYzeJmJSfL72AQ+A3w6MtIKt9v6K3vVFL8utnyUmXGwLcNeBoeY8kAFgc9wSzpxxwHbgmwNjzVkgX4Bt0aPcaQNeOzDXnATyFlhEncmrVDTngXyKW94uWJPz8rWloAMV5rI84R/MlTjjogOTrQqdrzCPHQmudQGHtBbsV/ITmD9mDuOBJ1VeJ8x5AU6558Boq0LvY0UUXsRdCcv5UN665aADk83Ju8gFeRyhMWdaj2OSVChFVyeOWeHAIMtZ4SZ0yyYHBlnO2oBj9FJ3xn0HBlkVehdXrzvi7uFAgmuEUtklbQX7Y/ij5Bhp6R/Dx1VeJ8x5IQ655MBkq0K9KS6dhM0nV6wt2K/DMlhcXI0T5sTDytbky+8jHpbfw3tj2IG55iCQ0SJhMXUgbE/u1BYu5fQ1bm/nsoU7Oa6OFq28tRwDKS2Ht0bPUg1gT6wiHukYEEkUPHsYPdxdS0DTgSEHxlmDHZQbSnpQ7ogD06wOR0m763gz0OyHrbvqVMInOmzdLJ8j9MZn+ynvnyM0QyBWJykQfEmB4EsKBF9SIPiSAqEBWmv0OzDKMtbNkoZioT/iac/NZ447MMwy1HCFr5uu5DD20SSBqIEZvhqYNfp7pKdOLf5uUAMzgQ8OzLMGCWQkrpfVRHtscVpvA63ggQzFLe9UaIkdDp45MNIKFshTYG+ajZTHEna81Gqc/2o1nur2rRBCCCGEEEIIIYQQQgghhBBCCEET8w8ABdheXNLBmAAAAABJRU5ErkJggg=="
        id="ticketImg"
        width={100}
        height={100}
        preserveAspectRatio="none"
      />
    </Defs>
  </Svg>
);

export default TicketIcon;
