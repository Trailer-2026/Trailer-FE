import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

/**
 * 회원가입/로그인 공용 바텀시트.
 * - RN Modal 미사용(안드로이드에서 여는 탭이 새 창으로 새어 즉시 닫히는 이슈).
 *   화면 내부 절대위치 오버레이 → 부모 최상위 View 바로 밑 형제로 둘 것.
 * - 열림 애니메이션 동안 배경(딤)을 disabled 로 둬, 시트를 여는 탭이 배경으로
 *   재전달돼도 닫힘이 발생하지 않게 한다. ready 후에만 배경 탭으로 닫힌다.
 * - 키보드: Modal 이 아니라 메인 창 안에 있고, 메인 창은 edge-to-edge 라
 *   adjustResize 로 줄어들지 않는다(댓글 시트는 Modal 이라 줄어든다). 그래서
 *   패널을 KeyboardAvoidingView(padding) 로 감싸 겹치는 높이만큼 위로 올린다.
 *   창이 줄어드는 기기에서는 겹침이 0 으로 계산돼 이중으로 밀리지 않는다.
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
    // 입력 중 배경 탭/뒤로가기로 닫히면 키보드가 남지 않게 함께 내린다.
    Keyboard.dismiss();
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

  // interpolate() 를 렌더 본문에서 매번 호출하면 렌더마다 새 네이티브 애니메이션
  // 노드가 만들어지고 이전 노드는 detach 된다. 이 과정에서 이미 버려진 노드를
  // 향해 connect 가 날아가면 "connectAnimatedNodes: Animated node with tag
  // (parent) [n] does not exist" 로 앱이 죽는다. useMemo 로 노드를 고정한다.
  const translateY = useMemo(
    () =>
      anim.interpolate({
        inputRange: [0, 1],
        outputRange: [verticalScale(460), 0],
      }),
    [anim],
  );
  const backdropOpacity = useMemo(
    () =>
      anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.45],
      }),
    [anim],
  );

  if (!rendered) return null;

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

      {/* 하단 패널 — KAV 가 키보드와 겹치는 만큼 paddingBottom 을 줘서 패널을 올린다 */}
      <KeyboardAvoidingView
        behavior="padding"
        enabled={visible}
        pointerEvents="box-none"
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
      >
      <Animated.View
        style={{
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
          className="text-gray-900"
          // Bold(700)와 SemiBold(600) 사이 굵기(Pretendard-650).
          // RN 타입엔 650 이 없어 숫자로 준다 — Text 래퍼가 정적 폰트로 매핑한다.
          style={{ fontSize: moderateScale(20), fontWeight: 650 as never }}
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
      </KeyboardAvoidingView>
    </View>
  );
}
