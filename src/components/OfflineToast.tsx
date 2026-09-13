import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { useNetworkStatus } from "@/src/api/network-status";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const VISIBLE_MS = 2500;

/**
 * 온라인/오프라인 전환 시 잠깐 떴다 사라지는 토스트.
 * 화면마다 헤더 레이아웃이 달라 상시 배너로 두면 겹칠 위험이 있어,
 * 어느 화면 위에도 안전한 하단 토스트로 대신한다.
 */
export default function OfflineToast() {
  const toast = useNetworkStatus((s) => s.toast);
  const clearToast = useNetworkStatus((s) => s.clearToast);
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    const hide = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) clearToast();
      });
    }, VISIBLE_MS);
    return () => clearTimeout(hide);
  }, [toast, opacity, clearToast]);

  if (!toast) return null;

  const offline = toast.kind === "offline";

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: insets.bottom + verticalScale(24),
        alignItems: "center",
      }}
    >
      <Animated.View
        style={{
          opacity,
          backgroundColor: offline ? "#3A3A3A" : "#2E7D5B",
          borderRadius: 999,
          paddingHorizontal: scale(16),
          paddingVertical: verticalScale(10),
          elevation: 6,
        }}
      >
        <Text
          className="text-white font-semibold"
          style={{ fontSize: moderateScale(13) }}
        >
          {offline ? "인터넷 연결을 확인해 주세요" : "다시 연결됐어요"}
        </Text>
      </Animated.View>
    </View>
  );
}
