import { Stack } from "expo-router";

export default function ReelsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // 영상 만들기 플로우는 전부 다크 배경 — 전환 중 흰 화면이 번쩍이지 않게
        contentStyle: { backgroundColor: "#000000" },
      }}
    >
      <Stack.Screen name="create" />
      <Stack.Screen name="gallery" />
      <Stack.Screen name="edit" />
      {/* 렌더 진행률 → 완료. 뒤로가기 제스처로 이탈해 폴링이 끊기지 않게 잠근다. */}
      <Stack.Screen name="progress" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
