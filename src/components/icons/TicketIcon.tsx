import * as React from "react";
import Svg, {
  Defs,
  Image,
  Pattern,
  Rect,
  type SvgProps,
  Use,
} from "react-native-svg";

/** 일정표 상세 히어로의 'KTX 티켓 정보 추가하기' 카드 아이콘(Figma 26x26). */
const TicketIcon = (props: SvgProps) => (
  <Svg width={26} height={26} viewBox="0 0 26 26" fill="none" {...props}>
    <Rect width={26} height={26} fill="url(#ticketPattern)" />
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
        xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEUElEQVR4nO2cS4gcVRSGL24EReNj50YTFXxFF+7ERSIYRZBsfYE43fdUgozuRN1ECSYz0+f0EHWTtUEFBUUXEtDo3lF8K2QUVIz4VlDQReaX2+khA/aAVamqe6r7/+Df1uX+f1XX7XNvnRAIIYQQQgghhBBCCCGEEEIIIYQQUgt7D+LCYoBr+oobu6y5RVwyaX5zizivjusnj+5fxgWhCe4b4FxRPB4VX4gB06BoeGLSXIsBdtQ81ufR8Jgcxjm1hCGG7WL4KreB0t1ATo2n+HLPANedURjFMi4TxY+5zZMpCGQcys+yhMsrByKKd3IbJ1MUyEiKY1XDuDm3adJsIIcnzttwT+NjK24qH4hhkNs0aVbfzh/C+RPm/XoLYy+WDiQqXnVgGhqV4ljPcMX6cj4anm1p7FfKB2J4O7th1lowv4hira3xkrcMxPyIgZgvMRDzJQZivsRAzJcYiG1qzMmoeE4U82IYRsUfbgMRxdHchkmTSsvcIe7cOOf+AFtH9abmxz5aJZAD2U2z5hQVb2wy70cbH9vwVOlAeoaLRHE8t3HSlBQHJgYyxK6Gxz2evA1VSLWe9PsaDS9GxQdi+Ce7kdatam9U/J28Sx4mLyfVzyqTLhYVc2JYyW2oOA8kKt4VwwNpSzg0zb59OEsUIobfcxsrzgKJhl9F0U8ehbbpD3GtKL7Oba74CeS73hKuDzlpbalo7gP5KW15Bw+I4fY2y9dShxRPbjKXnRXCPVkobg2eiIaXsptspUx8fpN5FBXCfSF4Ix0M69RTovirWMSVG+cwfwhni+KTktdZE8VVwSOieK9jT8n3aUWUXsTFELurLOfT8jZ4JSr25zZZnLyLXNDGERpxpmi4K3ilygql6yoG2BG80h/gltwGSfvaGbzSV9w7c0+I4u7gFb7UnREN73fMzBPj6vX2tHs4rtCWvc5K8Mi40NidP4aGP9ePkW78YxgNH5cMda23jKuDN0TxsgOTUUJH6iqdpM2n4InCcMesFxf7ituCB/YOsW10WDm3wZa3/J62ILKX39N7Ixq+yW2uOAhk/NSdKAw3tB7EaAt3iD3cwsWkUH5L29utbOHKArak6mjnlrfWYiCntVIYesmzWgOIiofHR1g+4jEgVFHy7MORh4aHKgf04DO4WAyruY2TaTsoZ1itdFBODAezm2btHyUddV3IdDOEWT9sXQyxO8sSvsph61n5HEEMR9Jve1Qsu/4cYRYCkXw3AgMRR2Ig5ksMxHyJgZgvMRCbgtYaqUFKdqOscb213lAs9UeMhqf9Np9RLDkwDE0pbRtM+ropKl5rfGzFQvknhA3M4KqB2bS/R2KmFn/R8GaoytwAl0bDD7nNkykJJG3zpnpZOBNSa9PU4jS3gdL9QFbTlneog9QEeNThQPFZbiOlY4FEw6dR8UhtjZT/E84CtrDVOP5Xq/Fat28JIYQQQgghhBBCCCGEEEIIIYSQMNv8CxuvpaEsWpXaAAAAAElFTkSuQmCC"
        id="ticketImg"
        width={100}
        height={100}
        preserveAspectRatio="none"
      />
    </Defs>
  </Svg>
);

export default TicketIcon;
