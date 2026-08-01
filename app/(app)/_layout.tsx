import { Stack } from "expo-router";

import RenderTracker from "@/src/features/video/components/RenderTracker";

export default function AppLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course" />
        <Stack.Screen name="reels" />
        <Stack.Screen name="travel/[travelIdx]" />
      </Stack>
      {/* 진행 중 렌더를 앱 어느 화면에서든 추적 → 완료 시 상단 배너 */}
      <RenderTracker />
    </>
  );
}
