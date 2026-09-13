import { Component, type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * 앱 최상위 에러 바운더리.
 *
 * 어느 화면이든 렌더 중 예외가 터지면(널 처리 누락 등) 전에는 앱 전체가 흰
 * 화면/강제종료로 이어졌다. 여기서 잡아 최소한 "다시 시도" 버튼이 있는
 * 화면으로 막는다 — 근본 원인을 고치는 게 아니라 최후의 방어선이다.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    // 별도 크래시 리포팅 도구가 없어 콘솔에만 남긴다 — adb logcat 으로 확인 가능.
    console.error("[ErrorBoundary] 렌더 중 예외:", error, info.componentStack);
  }

  private reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View
        className="flex-1 items-center justify-center bg-white"
        style={{ paddingHorizontal: scale(24) }}
      >
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(17) }}
        >
          문제가 발생했어요
        </Text>
        <Text
          className="text-gray-500 text-center"
          style={{ fontSize: moderateScale(13), marginTop: verticalScale(8) }}
        >
          일시적인 오류일 수 있어요. 다시 시도해 주세요.
        </Text>
        <Pressable
          onPress={this.reset}
          className="bg-gray-800 rounded-full active:opacity-80"
          style={{
            marginTop: verticalScale(20),
            paddingHorizontal: scale(20),
            paddingVertical: verticalScale(10),
          }}
          accessibilityRole="button"
          accessibilityLabel="다시 시도"
        >
          <Text
            className="text-white font-semibold"
            style={{ fontSize: moderateScale(14) }}
          >
            다시 시도
          </Text>
        </Pressable>
      </View>
    );
  }
}
