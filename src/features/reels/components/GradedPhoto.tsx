import Svg, {
  Defs,
  FeColorMatrix,
  FeComposite,
  Filter,
  Image,
} from "react-native-svg";

import {
  buildColorMatrix,
  buildGreenShiftMatrix,
  THEME_SPECS,
} from "@/src/features/video/theme-preview";
import type { VideoTheme } from "@/src/features/video/types";

/**
 * 테마 색보정을 입힌 사진 — 렌더러가 지도에 굽는 32³ LUT(map_themes.js colorGrade)를
 * 같은 계수의 SVG 필터로 옮긴 것이다.
 *
 * 두 단계로 나눠 건다:
 *  1) 초록 시프트(봄 벚꽃/가을 단풍) — 밀어낼 양만 뽑아 원본에 더한다.
 *     필터가 중간 결과를 [0,1] 로 자르는 성질이 LUT 의 max(0, …) 역할을 한다.
 *  2) 나머지(틴트·대비·채도·밝기) — 행렬 하나로 합쳐 그대로 적용.
 */
export default function GradedPhoto({
  uri,
  theme,
  width,
  height,
}: {
  uri: string;
  theme: VideoTheme;
  width: number;
  height: number;
}) {
  const grade = THEME_SPECS[theme].colorGrade;
  const matrix = buildColorMatrix(grade);
  const greenShift = buildGreenShiftMatrix(grade);
  const filterId = `grade-${theme}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <Filter id={filterId} x="0" y="0" width="100%" height="100%">
          {greenShift ? (
            <>
              <FeColorMatrix
                in="SourceGraphic"
                type="matrix"
                values={greenShift}
                result="shift"
              />
              <FeComposite
                in="SourceGraphic"
                in2="shift"
                operator="arithmetic"
                k2={1}
                k3={1}
                result="shifted"
              />
              <FeColorMatrix in="shifted" type="matrix" values={matrix} />
            </>
          ) : (
            <FeColorMatrix in="SourceGraphic" type="matrix" values={matrix} />
          )}
        </Filter>
      </Defs>
      <Image
        href={{ uri }}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        filter={grade ? `url(#${filterId})` : undefined}
      />
    </Svg>
  );
}
