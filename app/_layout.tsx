import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import 'react-native-reanimated';
import "../global.css";

import { useAuthStore } from "@/src/features/auth/store";
import { initializeKakaoSDK } from "@react-native-kakao/core";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// 앱이 켜질 때 스플래시 스크린을 유지하고, 소셜 로그인 SDK를 초기화합니다.
SplashScreen.preventAutoHideAsync();
initializeKakaoSDK(process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY!);
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
});

export const unstable_settings = {
  anchor: "(onboarding)",
};

export default function RootLayout() {
  const { isAuthenticated, isBootstrapping, bootstrap } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!isBootstrapping) {
      SplashScreen.hideAsync();
    }
  }, [isBootstrapping]);

  if (isBootstrapping) return null;

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