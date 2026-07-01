import { Text as RNText, type TextProps } from "react-native";

/**
 * 앱 전역 기본 폰트(Pretendard)를 적용한 Text.
 * react-native 의 Text 대신 이 컴포넌트를 import 해서 사용하세요.
 * NativeWind className·style 모두 그대로 동작합니다.
 * (가변폰트라 font-bold / font-semibold 등 weight 클래스도 그대로 반영됩니다.)
 */
export function Text({ style, ...props }: TextProps) {
  return <RNText style={[{ fontFamily: "Pretendard" }, style]} {...props} />;
}
