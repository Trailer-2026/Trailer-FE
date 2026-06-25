import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/features/course/components/PrimaryButton";
import { StepHeader } from "@/src/features/course/components/StepHeader";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const total = 2500;
    const tick = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(100, Math.round((elapsed / total) * 100));
      setProgress(next);
      if (next >= 100) {
        clearInterval(tick);
        router.replace("/course/result");
      }
    }, 80);

    return () => clearInterval(tick);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <StepHeader progress={1} />

      <View className="flex-1 items-center justify-center px-5">
        <ActivityIndicator size="large" color="#374151" />
        <Text className="mt-6 text-4xl font-extrabold text-gray-900">
          {progress}%
        </Text>
        <Text className="mt-3 text-base text-gray-600">
          일정을 만들고 있어요
        </Text>
      </View>

      <View className="px-5 pb-4">
        <PrimaryButton label="다음" disabled />
      </View>
    </SafeAreaView>
  );
}
