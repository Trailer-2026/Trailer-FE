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
      {/* 직접 만든 영상 업로드 — 렌더 파이프라인을 타지 않는 단독 화면 */}
      <Stack.Screen name="upload" />
      <Stack.Screen name="gallery" />
      <Stack.Screen name="edit" />
      {/* 렌더 진행률 → 완료. 추적은 전역(RenderTracker)이 하므로 화면을 떠나도 된다. */}
      <Stack.Screen name="progress" />
      {/* 완성된 영상 편집(구간 삭제·사진 삽입) — 서버에 즉시 반영, 되돌리기 없음 */}
      <Stack.Screen name="studio" />
    </Stack>
  );
}
