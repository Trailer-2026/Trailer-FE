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
    </Stack>
  );
}
