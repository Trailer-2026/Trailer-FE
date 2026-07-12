import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { StepHeader } from "@/src/features/course/components/StepHeader";
import { describeRecommendError } from "@/src/features/course/errors";
import { useRecommendCourses } from "@/src/features/course/queries";
import { buildRecommendCriteria, useCourseStore } from "@/src/features/course/store";
import { moderateScale, verticalScale } from "@/src/utils/responsive";

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
      <StepHeader step={4} steps={4} />

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
            <LoadingSpinner progress={progress} />
            <Text
              className="font-bold"
              style={{
                color: "#5E84F4",
                fontSize: moderateScale(28),
                marginTop: verticalScale(30),
              }}
            >
              {progress}%
            </Text>
            <Text
              className="text-gray-400"
              style={{ fontSize: moderateScale(15), marginTop: verticalScale(8) }}
            >
              일정을 만들고 있어요
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* 스포크 스피너 — 막대 8개가 progress 에 비례해 파란색으로 채워짐        */
/*   (100% 에서 8개 전부 파랑), 전체가 회전.                             */
/*   RN 내장 Animated 사용(babel reanimated 플러그인 불필요).            */
/*   각 막대는 삼각함수로 방사형 배치(transformOrigin 미사용).            */
/* ------------------------------------------------------------------ */
const SPINNER_SIZE = moderateScale(94);
const SPOKE_W = moderateScale(8);
const SPOKE_LEN = moderateScale(24);
const SPOKE_GAP = moderateScale(13); // 중심 ~ 막대 안쪽 끝
const SPOKE_COUNT = 8;
const SPIN_CENTER = SPINNER_SIZE / 2;
const SPIN_RADIUS = SPOKE_GAP + SPOKE_LEN / 2; // 막대 중심까지의 반지름

function LoadingSpinner({ progress }: { progress: number }) {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rot, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [rot]);

  const spin = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // progress(0~100) 만큼 막대를 파랗게 채운다. 최소 1개는 채워 활성 표시.
  const filled = Math.max(
    1,
    Math.min(SPOKE_COUNT, Math.round((progress / 100) * SPOKE_COUNT)),
  );

  return (
    <Animated.View
      style={{
        width: SPINNER_SIZE,
        height: SPINNER_SIZE,
        transform: [{ rotate: spin }],
      }}
    >
      {Array.from({ length: SPOKE_COUNT }).map((_, i) => {
        const theta = ((2 * Math.PI) / SPOKE_COUNT) * i;
        const cx = SPIN_CENTER + SPIN_RADIUS * Math.sin(theta);
        const cy = SPIN_CENTER - SPIN_RADIUS * Math.cos(theta);
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: cx - SPOKE_W / 2,
              top: cy - SPOKE_LEN / 2,
              width: SPOKE_W,
              height: SPOKE_LEN,
              borderRadius: SPOKE_W / 2,
              backgroundColor: i < filled ? "#5E84F4" : "#E5E7EB",
              transform: [{ rotate: `${(360 / SPOKE_COUNT) * i}deg` }],
            }}
          />
        );
      })}
    </Animated.View>
  );
}
