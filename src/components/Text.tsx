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
//
// ⚠️ 700(=font-bold / fontWeight:"bold")도 Pretendard-650 을 쓴다.
//    앱 전체 굵은 글씨를 한 단계 얇게 통일하기로 해서, 화면 83곳의 className 을
//    일일이 고치는 대신 여기 매핑 한 곳에서 처리한다.
//    다시 진짜 Bold 로 되돌리려면 700 의 family 를 "Pretendard-Bold" 로 바꾸면 된다.
//    (Pretendard-Bold.otf 는 계속 로드돼 있으므로 그것만 바꾸면 즉시 복구)
const STATIC_FAMILIES: { weight: number; family: string }[] = [
  { weight: 400, family: "Pretendard-Regular" },
  { weight: 500, family: "Pretendard-Medium" },
  { weight: 600, family: "Pretendard-SemiBold" },
  { weight: 650, family: "Pretendard-650" },
  { weight: 700, family: "Pretendard-650" },
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
