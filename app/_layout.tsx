import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "@/src/features/auth/store";

SplashScreen.preventAutoHideAsync();

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
