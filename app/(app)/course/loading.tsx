import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { PrimaryButton } from "@/src/features/course/components/PrimaryButton";
import { StepHeader } from "@/src/features/course/components/StepHeader";
import { describeRecommendError } from "@/src/features/course/errors";
import { useRecommendCourses } from "@/src/features/course/queries";
import { buildRecommendCriteria, useCourseStore } from "@/src/features/course/store";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  // 로딩 진입 시점의 store 스냅샷으로 criteria 를 고정한다.
  // (진입 후 store 가 바뀌어도 이 요청은 그대로 유지)
  // 마운트 1회만 store 스냅샷을 읽어 criteria 를 고정한다.
  const criteria = useMemo(() => {
    try {
      return buildRecommendCriteria(useCourseStore.getState(), 0);
    } catch {
      return null;
    }
  }, []);

  const { data, error, isError, refetch, isFetching } = useRecommendCourses(criteria);

  // 프로그레스는 순수 시각 효과. 데이터 도착 여부와 별개로 진행.
  useEffect(() => {
    const startedAt = Date.now();
    const total = 2500;
    const tick = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(100, Math.round((elapsed / total) * 100));
      setProgress(next);
      if (next >= 100) clearInterval(tick);
    }, 80);
    return () => clearInterval(tick);
  }, []);

  // 응답이 도착하고 프로그레스가 어느정도 진행되면 결과로 이동.
  useEffect(() => {
    if (data && progress >= 100) {
      router.replace("/course/result");
    }
  }, [data, progress]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <StepHeader progress={1} />

      <View className="flex-1 items-center justify-center px-5">
        {isError ? (
          <>
            <Text className="text-base font-semibold text-gray-900">
              추천을 불러오지 못했어요
            </Text>
            <Text
              className="mt-2 text-sm text-gray-500 text-center"
              selectable
            >
              {describeRecommendError(error)}
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="mt-6 bg-gray-800 rounded-full px-6 py-3"
            >
              <Text className="text-white font-semibold">
                {isFetching ? "다시 시도 중…" : "다시 시도"}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color="#D1D5DB" />
            <Text className="mt-8 text-sm text-gray-400">{progress}%</Text>
            <Text className="mt-2 text-xl font-bold text-gray-900">
              일정을 만들고 있어요
            </Text>
          </>
        )}
      </View>

      <View className="px-5 pb-4">
        <PrimaryButton label="다음" disabled />
      </View>
    </SafeAreaView>
  );
}
