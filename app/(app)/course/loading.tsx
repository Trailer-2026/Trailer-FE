import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const progressRef = useRef(0);

  // 로딩 진입 시점의 store 스냅샷으로 criteria 를 고정한다.
  // (진입 후 store 가 바뀌어도 이 요청은 그대로 유지)
  const criteria = useMemo(() => {
    try {
      return buildRecommendCriteria(useCourseStore.getState(), 0);
    } catch {
      return null;
    }
  }, []);

  const { data, error, isError, refetch, isFetching } = useRecommendCourses(criteria);

  // 대기 페이즈: 시간에 대한 asymptotic 곡선.
  // 초반엔 빠르게 오르고 위로 갈수록 느려져 95% 근처에서 대기.
  // (HTTP POST 는 중간 진행률 신호가 없어 진짜 % 는 불가능. 100 은 응답 도착 시에만 도달.)
  useEffect(() => {
    if (data || isError) return;
    const startedAt = Date.now();
    const T = 8000; // 시상수(ms). ~15s 에서 80%, ~25s 에서 90% 근처.
    const tick = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.round(95 * (1 - Math.exp(-elapsed / T)));
      progressRef.current = next;
      setProgress(next);
    }, 50);
    return () => clearInterval(tick);
  }, [data, isError]);

  // 마무리 페이즈: 응답 도착 시 현재값 → 100 스퍼트 후 결과로 이동.
  useEffect(() => {
    if (!data) return;
    const startedAt = Date.now();
    const from = progressRef.current;
    const duration = 300;
    const tick = setInterval(() => {
      const t = Math.min(1, (Date.now() - startedAt) / duration);
      const next = Math.round(from + (100 - from) * t);
      progressRef.current = next;
      setProgress(next);
      if (t >= 1) {
        clearInterval(tick);
        router.replace("/course/result");
      }
    }, 16);
    return () => clearInterval(tick);
  }, [data]);

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
