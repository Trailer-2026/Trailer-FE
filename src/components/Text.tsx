import {
  Text as RNText,
  StyleSheet,
  type TextProps,
  type TextStyle,
} from "react-native";

/**
 * 앱 전역 기본 폰트(Pretendard) Text.
 * react-native 의 Text 대신 이 컴포넌트를 import 해서 사용하세요.
 *
 * 안드로이드는 가변폰트의 fontWeight(중간 weight)를 제대로 렌더링하지 못한다.
 * 그래서 weight 별 "정적" 폰트를 각각 로드하고(app/_layout.tsx),
 * className/style 로 지정된 fontWeight 를 가장 가까운 정적 패밀리로 치환한다.
 * (fontWeight 속성은 제거 — 커스텀 폰트와 충돌해 무시되므로 fontFamily 로만 제어)
 */

// app/_layout.tsx 의 useFonts 키와 일치해야 함.
const STATIC_FAMILIES: { weight: number; family: string }[] = [
  { weight: 400, family: "Pretendard-Regular" },
  { weight: 500, family: "Pretendard-Medium" },
  { weight: 600, family: "Pretendard-SemiBold" },
  { weight: 650, family: "Pretendard-650" }, // 제목(700)보다 얇고 SemiBold(600)보다 굵은 본문용
  { weight: 700, family: "Pretendard-Bold" },
];

function toNumber(w: TextStyle["fontWeight"]): number {
  if (w === "bold") return 700;
  if (w == null || w === "normal") return 400;
  const n = Number(w);
  return Number.isFinite(n) ? n : 400;
}

/** 지정 weight 에 가장 가까운(로드된) 정적 패밀리 선택. */
function familyForWeight(weight: number): string {
  let best = STATIC_FAMILIES[0];
  for (const s of STATIC_FAMILIES) {
    if (Math.abs(s.weight - weight) < Math.abs(best.weight - weight)) best = s;
  }
  return best.family;
}

export function Text({ style, ...props }: TextProps) {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const { fontWeight, ...rest } = flat;
  const fontFamily = familyForWeight(toNumber(fontWeight));
  return <RNText style={[{ fontFamily }, rest]} {...props} />;
}
