import { Stack } from "expo-router";

import PushBanner from "@/src/features/notification/components/PushBanner";
import AutoBoarding from "@/src/features/scenic/components/AutoBoarding";
import RenderTracker from "@/src/features/video/components/RenderTracker";

export default function AppLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course" />
        <Stack.Screen name="reels" />
        <Stack.Screen name="travel/[travelIdx]" />
        <Stack.Screen name="travel/manual" />
        <Stack.Screen name="travel/video" />
        <Stack.Screen name="place/[contentId]" />
      </Stack>
      {/* 진행 중 렌더를 앱 어느 화면에서든 추적 → 완료 시 상단 배너 */}
      <RenderTracker />
      {/* 포그라운드에서 받은 푸시 → 상단 인앱 배너(안드로이드는 시스템 알림이 안 뜬다) */}
      <PushBanner />
      {/* 열차 출발 시각이 되면 탑승 세션 시작(시각표 표시 + GPS 보정), 도착하면 종료 */}
      <AutoBoarding />
    </>
  );
}
