import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated';
import "../global.css";

import { queryClient } from "@/src/api/query-client";
import { useAuthStore } from "@/src/features/auth/store";
import {
  setupForegroundHandler,
  setupNotificationOpenHandlers,
} from "@/src/features/notification/handlers";
import { setupTokenRefresh } from "@/src/features/notification/fcm";
import { initializeKakaoSDK } from "@react-native-kakao/core";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { QueryClientProvider } from "@tanstack/react-query";

// 앱이 켜질 때 스플래시 스크린을 유지하고, 소셜 로그인 SDK를 초기화합니다.
SplashScreen.preventAutoHideAsync();
initializeKakaoSDK(process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY!);
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
});

// ⚠️ FCM 백그라운드/종료 상태 데이터 메시지 처리가 필요해지면
//    바로 이 모듈 스코프(컴포넌트 바깥)에서 아래처럼 등록한다:
//   import { getApp } from "@react-native-firebase/app";
//   import { getMessaging, setBackgroundMessageHandler } from "@react-native-firebase/messaging";
//   setBackgroundMessageHandler(getMessaging(getApp()), async (msg) => { ... });
// 현재는 notification 페이로드만 사용하므로 등록하지 않는다.

export const unstable_settings = {
  anchor: "(onboarding)",
};

export default function RootLayout() {
  const { isAuthenticated, isBootstrapping, bootstrap } = useAuthStore();
  // 가변폰트 하나로는 안드로이드에서 중간 weight 가 렌더링되지 않아,
  // weight 별 정적 폰트를 각각 로드한다. (매핑은 src/components/Text.tsx)
  const [fontsLoaded] = useFonts({
    "Pretendard-Regular": require("../assets/fonts/Pretendard-Regular.otf"),
    "Pretendard-Medium": require("../assets/fonts/Pretendard-Medium.otf"),
    "Pretendard-SemiBold": require("../assets/fonts/Pretendard-SemiBold.otf"),
    // 600(SemiBold)과 700(Bold) 사이 중간 굵기. 가변폰트에서 wght=650 으로 추출한 정적 파일.
    "Pretendard-650": require("../assets/fonts/Pretendard-650.ttf"),
    "Pretendard-Bold": require("../assets/fonts/Pretendard-Bold.otf"),
  });

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!isBootstrapping && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isBootstrapping, fontsLoaded]);

  // 로그인된 사용자 한정으로 FCM 수신 핸들러 + 토큰 갱신 구독, 언마운트/로그아웃 시 해제
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubForeground = setupForegroundHandler();
    const unsubOpen = setupNotificationOpenHandlers();
    const unsubRefresh = setupTokenRefresh();
    return () => {
      unsubForeground();
      unsubOpen();
      unsubRefresh();
    };
  }, [isAuthenticated]);

  if (isBootstrapping || !fontsLoaded) return null;

  return (
    // 드래그 정렬(react-native-reorderable-list)이 gesture-handler 를 쓰므로
    // 안드로이드에서는 루트를 GestureHandlerRootView 로 감싸야 제스처가 전달된다.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="(onboarding)" />
          </Stack.Protected>

          <Stack.Protected guard={isAuthenticated}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
        </Stack>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}