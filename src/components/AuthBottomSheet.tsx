import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, BackHandler, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

/**
 * 회원가입/로그인 공용 바텀시트.
 * - RN Modal 미사용(안드로이드에서 여는 탭이 새 창으로 새어 즉시 닫히는 이슈).
 *   화면 내부 절대위치 오버레이 → 부모 최상위 View 바로 밑 형제로 둘 것.
 * - 열림 애니메이션 동안 배경(딤)을 disabled 로 둬, 시트를 여는 탭이 배경으로
 *   재전달돼도 닫힘이 발생하지 않게 한다. ready 후에만 배경 탭으로 닫힌다.
 */
const READY_MS = 350;

export function AuthBottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [rendered, setRendered] = useState(visible);
  const [ready, setReady] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      setReady(false);
      Animated.timing(anim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }).start();
      const t = setTimeout(() => setReady(true), READY_MS);
      return () => clearTimeout(t);
    }
    setReady(false);
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setRendered(false);
    });
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // 안드로이드 하드웨어 뒤로가기 (열린 뒤에만).
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (ready) onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, ready, onClose]);

  if (!rendered) return null;

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [verticalScale(460), 0],
  });
  const backdropOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* 딤 배경 — 열림 애니메이션 동안은 disabled (여는 탭 재전달 무시) */}
      <Pressable
        style={StyleSheet.absoluteFill}
        disabled={!ready}
        onPress={onClose}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "#000000",
            opacity: backdropOpacity,
          }}
        />
      </Pressable>

      {/* 하단 패널 */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: scale(24),
          borderTopRightRadius: scale(24),
          paddingHorizontal: scale(24),
          paddingTop: verticalScale(36),
          paddingBottom: verticalScale(24) + insets.bottom,
          transform: [{ translateY }],
        }}
      >
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(20) }}
        >
          {title}
        </Text>
        <Text
          className="text-gray-400 font-medium"
          style={{ fontSize: moderateScale(14), marginTop: verticalScale(6) }}
        >
          {subtitle}
        </Text>

        <View style={{ marginTop: verticalScale(24) }}>{children}</View>
      </Animated.View>
    </View>
  );
}
