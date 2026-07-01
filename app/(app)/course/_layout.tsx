import { Stack } from "expo-router";

export default function CourseLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="origin-destination" />
      <Stack.Screen name="passengers" />
      <Stack.Screen name="styles" />
      <Stack.Screen name="loading" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
