import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import PastTravelSections from "@/src/features/travel/components/PastTravelSections";
import TravelDetailView from "@/src/features/travel/components/TravelDetailView";
import {
  useCurrentTravel,
  usePastTravels,
  useToggleTravelLike,
} from "@/src/features/travel/queries";
import type { PastTravelCard } from "@/src/features/travel/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";

type Tab = "upcoming" | "past";

/**
 * 세 번째 탭 '내 일정' — 예정된 여행(일정표 상세) / 다녀온 여행(목록).
 * 승차권 예매·일정추천 진입은 홈 퀵메뉴('승차권 예매' → /course/intro)로 유지된다.
 */
export default function CalendarTab() {
  const [tab, setTab] = useState<Tab>("upcoming");

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* 헤더 */}
      <View
        className="flex-row items-center bg-white"
        style={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(6),
          paddingBottom: verticalScale(8),
          gap: scale(10),
        }}
      >
        <Pressable onPress={() => router.navigate("/")} hitSlop={12}>
          <BackIcon
            color="#111827"
            width={moderateScale(14)}
            height={moderateScale(20)}
          />
        </Pressable>
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(20) }}
        >
          내 일정
        </Text>
      </View>

      {/* 서브탭 */}
      <View className="flex-row bg-white">
        {(
          [
            { key: "upcoming", label: "예정된 여행" },
            { key: "past", label: "다녀온 여행" },
          ] as const
        ).map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              className="items-center"
              style={{ flex: 1, paddingVertical: verticalScale(12) }}
            >
              <Text
                className={active ? "font-bold text-gray-900" : "text-gray-400"}
                style={{ fontSize: moderateScale(15) }}
              >
                {t.label}
              </Text>
              <View
                style={{
                  marginTop: verticalScale(8),
                  height: verticalScale(3),
                  width: "70%",
                  borderRadius: 999,
                  backgroundColor: active ? "#111827" : "transparent",
                }}
              />
            </Pressable>
          );
        })}
      </View>

      {tab === "upcoming" ? <UpcomingTab /> : <PastTab />}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* 예정된 여행 — 현재/예정 여행 1건의 일정표 상세                        */
/* ------------------------------------------------------------------ */
function UpcomingTab() {
  const { data: current, isLoading } = useCurrentTravel();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  if (!current) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white"
        style={{ gap: verticalScale(16), paddingHorizontal: scale(24) }}
      >
        <Text className="text-gray-400" style={{ fontSize: moderateScale(15) }}>
          예정된 여행이 없어요
        </Text>
        <Pressable
          onPress={() => router.navigate("/course/intro")}
          className="items-center justify-center rounded-2xl active:opacity-80"
          style={{
            paddingHorizontal: scale(24),
            height: verticalScale(48),
            backgroundColor: ACCENT,
          }}
        >
          <Text
            className="text-white font-bold"
            style={{ fontSize: moderateScale(15) }}
          >
            일정 만들러 가기
          </Text>
        </Pressable>
      </View>
    );
  }

  return <TravelDetailView travelIdx={current.travel_idx} />;
}

/* ------------------------------------------------------------------ */
/* 다녀온 여행 — 지난 여행 목록(주요/지난). profile 과 공통 컴포넌트 사용   */
/* ------------------------------------------------------------------ */
function PastTab() {
  const { data, isLoading } = usePastTravels();
  const toggleLike = useToggleTravelLike();

  const travels = data?.travels ?? [];

  function handleToggleLike(t: PastTravelCard) {
    toggleLike.mutate(
      { travelIdx: t.travel_idx, currentlyLiked: t.liked },
      { onError: () => Alert.alert("오류", "잠시 후 다시 시도해 주세요.") },
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  if (travels.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400" style={{ fontSize: moderateScale(15) }}>
          아직 다녀온 여행이 없어요
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: scale(20),
        paddingTop: verticalScale(8),
        paddingBottom: verticalScale(24),
      }}
    >
      <PastTravelSections
        travels={travels}
        onToggleLike={handleToggleLike}
        onPressItem={(t) => router.push(`/travel/${t.travel_idx}`)}
      />
    </ScrollView>
  );
}
