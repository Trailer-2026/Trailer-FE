import * as React from "react";
import Svg, {
  Defs,
  Image,
  Pattern,
  Rect,
  type SvgProps,
  Use,
} from "react-native-svg";

/** '일정 만들기' 시트의 직접 만들기 아이콘(Figma 25x25). */
const PencilIcon = (props: SvgProps) => (
  <Svg width={25} height={25} viewBox="0 0 25 25" fill="none" {...props}>
    <Rect width={25} height={25} fill="url(#pencilPattern)" />
    <Defs>
      <Pattern
        id="pencilPattern"
        width={1}
        height={1}
        patternContentUnits="objectBoundingBox"
      >
        <Use xlinkHref="#pencilImg" transform="scale(.01)" />
      </Pattern>
      <Image
        xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAADHElEQVR4nO3dsWtTURTH8SKKiqOIDi4uLurirIi7oA4uoojtvSe1sYO4KnERxJwTLKLQTbAu+geIk4sIgoubDjoJjh3USexPXtNoLEnavtz0nub9PvC20J6Xb+97yW1JJyaIiIiIiIjItdDCkZphKhpOyTx25J6n0qJiMhp+iQHLh2JRFM/EcDr3bJVTa6+K339jrDqi4l2xanLPWQmiCINidK2YJTE8vtTEntwzV3ZlSO/jQ7iHg7lnHzuikJWf+o3E6FzCPs/cx4Hc5zA2oqFWNkbX8Z6XrwSCIZa4TPW7rzxKMVNlhRZOJlgZ/93oi6+Z+7y2rGi4kyzGv/vJ29zntWWF1CukE4XvUcoTRT11lKh4OsRIFAwx8b1kkXtfa6i1cDYaXojh1uwcdo56pfDmPsDqJzsqXl5pYNdajxvysjU5aKbKkj5P8iijFLvExdZ9njN2TNZ4ckcRpXiTydUxzN6U4tUNw+4kN/ri8YprveapNNnoRmGKKIyReNd2mCiKpWiY6TNSdckQW+ilozDGiGKUidK+TNX7jFRdkvhN3bpefXFlbN5e1KAoKxuSDVGc6DNSdUmqy9QGL1+0iSuj10rptfdFGWJ0rZTb3d+fcsZoH8+7Z6CcMRRLxdZ9ZwbarBt4nxiimO3MQCsYwxFhDD+EMfwQxvBDGMMPYQw/hDH8EMbwQxhjjP+M0xijtMAYfgTG8IMxHGEMRxjDEcZwhDEcYQxHGMMRxnCEMRxhDEcYwxHGcIQxHGEMRxjDEcZwhDEcYQxHGMMRxnCEMRxhDEdiE5dzxIiG67nP3Z1GA9ui4RtjOCGGY7xMefuAesbwQxRPGMMRMXxiDCfqD7F35K+ulDHWLSjOMIYj0XCXMRyJhteM4USjge1R8Z0xnJAWjjOGt8+kYgw/xLDAGI6I4QtjODH1APtTxIiKr2K4mPt8tjxRnCsZ4OPy3pdCpps4Wmzd5z6XsSAtTK8jwI+oeCOKOTFcuDqHfbnnHluhiUOi+LkqQHFPWSh+cVS8JC7ep+Ses1KC4rAYbgbDef4HZCIiIiIioomx8gdd4qzp9UP+TgAAAABJRU5ErkJggg=="
        id="pencilImg"
        width={100}
        height={100}
        preserveAspectRatio="none"
      />
    </Defs>
  </Svg>
);

export default PencilIcon;
