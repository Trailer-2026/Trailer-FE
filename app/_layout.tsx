import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import 'react-native-reanimated';
import "../global.css";

import { useAuthStore } from "@/src/features/auth/store";
import {
  setupForegroundHandler,
  setupNotificationOpenHandlers,
} from "@/src/features/notification/handlers";
import { setupTokenRefresh } from "@/src/features/notification/fcm";
import { initializeKakaoSDK } from "@react-native-kakao/core";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// 앱이 켜질 때 스플래시 스크린을 유지하고, 소셜 로그인 SDK를 초기화합니다.
SplashScreen.preventAutoHideAsync();
initializeKakaoSDK(process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY!);
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
});

// ⚠️ FCM 백그라운드/종료 상태 데이터 메시지 처리가 필요해지면
//    바로 이 모듈 스코프(컴포넌트 바깥)에서 아래처럼 등록한다:
//   import messaging from "@react-native-firebase/messaging";
//   messaging().setBackgroundMessageHandler(async (msg) => { ... });
// 현재는 notification 페이로드만 사용하므로 등록하지 않는다.

export const unstable_settings = {
  anchor: "(onboarding)",
};

export default function RootLayout() {
  const { isAuthenticated, isBootstrapping, bootstrap } = useAuthStore();
  const [fontsLoaded] = useFonts({
    Pretendard: require("../assets/fonts/PretendardVariable.ttf"),
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
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>

        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}