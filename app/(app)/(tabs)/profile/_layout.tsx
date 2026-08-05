import { Stack } from "expo-router";

/**
 * 프로필 탭 내부 스택.
 * 내 정보(index) → 닉네임 편집 / 여행 조회 등 하위 화면을 push 해도
 * 하단 탭바가 유지되고 프로필 탭이 활성 상태로 남도록 탭 안에 스택을 둔다.
 */
export default function ProfileStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="me" />
      <Stack.Screen name="nickname" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="social" />
      <Stack.Screen name="travels" />
      <Stack.Screen name="version" />
      <Stack.Screen name="terms" />
    </Stack>
  );
}
