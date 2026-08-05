import { Stack } from "expo-router";

/** 약관 및 정책 목록 → 개별 문서 상세로의 push 스택. */
export default function TermsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[kind]" />
    </Stack>
  );
}
