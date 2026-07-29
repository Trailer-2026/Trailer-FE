import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect } from "react";
import { AppState, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { useActiveRenderStore, type RenderBanner } from "../active-render-store";
import { videoKeys } from "../keys";
import { isJobNotFound, useRenderStatus } from "../queries";

const ACCENT = "#5E84F4";

/**
 * 앱 전역 렌더 추적기 — (app) 레이아웃에 항상 마운트.
 *
 * - 저장된 job 을 복구하고(hydrate), job_id 가 있으면 어느 화면에서든 폴링한다.
 * - 앱이 포그라운드로 돌아오면 즉시 최신 상태를 재확인.
 * - done|failed 를 감지하면(진행률 화면 밖일 때) 상단 인앱 배너를 띄운다.
 * - 존재하지 않는 job(404)은 추적을 정리한다.
 */
export default function RenderTracker() {
  const jobId = useActiveRenderStore((s) => s.jobId);
  const hydrated = useActiveRenderStore((s) => s.hydrated);
  const hydrate = useActiveRenderStore((s) => s.hydrate);
  const notify = useActiveRenderStore((s) => s.notify);
  const acknowledge = useActiveRenderStore((s) => s.acknowledge);
  const banner = useActiveRenderStore((s) => s.banner);

  const queryClient = useQueryClient();

  // 최초 1회: 저장된 job 복구
  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  // 포그라운드 복귀 시 즉시 재확인(백그라운드 동안 멈춘 폴링 보완)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && jobId) {
        void queryClient.invalidateQueries({
          queryKey: videoKeys.status(jobId),
        });
      }
    });
    return () => sub.remove();
  }, [jobId, queryClient]);

  const { data, error } = useRenderStatus(jobId);

  // 완료/실패 감지 → 배너
  useEffect(() => {
    if (data && (data.status === "done" || data.status === "failed")) {
      notify(data);
    }
  }, [data, notify]);

  // 사라진 job(404) → 추적 정리(재실행마다 헛폴링 방지)
  useEffect(() => {
    if (jobId && isJobNotFound(error)) acknowledge();
  }, [jobId, error, acknowledge]);

  if (!banner) return null;

  const onPress = () => {
    router.push(`/reels/progress?job_id=${banner.jobId}`);
    acknowledge();
  };

  return <Banner banner={banner} onPress={onPress} onClose={acknowledge} />;
}

function Banner({
  banner,
  onPress,
  onClose,
}: {
  banner: RenderBanner;
  onPress: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const done = banner.status === "done";

  return (
    <View
      className="absolute inset-x-0"
      style={{ top: insets.top + verticalScale(8), paddingHorizontal: scale(16) }}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        className="flex-row items-center active:opacity-90"
        style={{
          backgroundColor: "#1C1C1C",
          borderRadius: scale(14),
          borderWidth: 1,
          borderColor: done ? ACCENT : "#5A3A3A",
          paddingVertical: verticalScale(12),
          paddingHorizontal: scale(14),
          gap: scale(12),
          // 안드로이드 그림자
          elevation: 8,
          shadowColor: "#000000",
        }}
        accessibilityRole="button"
        accessibilityLabel={done ? "완성된 영상 보기" : "실패한 렌더 보기"}
      >
        <Text style={{ fontSize: moderateScale(20) }}>{done ? "🎉" : "⚠️"}</Text>

        <View className="flex-1">
          <Text
            className="font-semibold text-white"
            style={{ fontSize: moderateScale(14) }}
          >
            {done ? "영상이 완성됐어요" : "영상 만들기에 실패했어요"}
          </Text>
          <Text
            className="text-gray-400"
            style={{ fontSize: moderateScale(12), marginTop: verticalScale(2) }}
            numberOfLines={1}
          >
            {done ? "탭하여 확인하기" : "탭하여 자세히 보기"}
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          hitSlop={12}
          className="active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="알림 닫기"
        >
          <Text
            className="text-gray-500"
            style={{ fontSize: moderateScale(18) }}
          >
            ✕
          </Text>
        </Pressable>
      </Pressable>
    </View>
  );
}
