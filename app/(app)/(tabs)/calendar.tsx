import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TicketIcon from "@/src/components/icons/TicketIcon";
import { Text } from "@/src/components/Text";
import PastTravelSections from "@/src/features/travel/components/PastTravelSections";
import TravelDetailView from "@/src/features/travel/components/TravelDetailView";
import {
  useCurrentTravel,
  usePastTravels,
  useToggleTravelLike,
} from "@/src/features/travel/queries";
import type {
  HomeTravelCard,
  PastTravelCard,
} from "@/src/features/travel/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";

type Tab = "upcoming" | "past";

/**
 * 세 번째 탭 '내 일정' — 예정된 여행(일정표 상세) / 다녀온 여행(목록).
 * 승차권 예매·일정추천 진입은 홈 퀵메뉴('승차권 예매' → /course/intro)로 유지된다.
 */
export default function CalendarTab() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const { data: current, isLoading: currentLoading } = useCurrentTravel();

  // 프로모 배너는 예정된 여행이 없을 때(계획 시작 유도)만 노출 — 목업 기준.
  const showBanner = tab === "upcoming" && !currentLoading && !current;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* 헤더 */}
      <View
        className="flex-row items-center justify-between bg-white"
        style={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(6),
          paddingBottom: verticalScale(10),
        }}
      >
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(24) }}
        >
          내 일정
        </Text>
        <Pressable
          // TODO(ticket): 승차권함 진입(현재 무동작).
          hitSlop={12}
          className="active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="승차권"
        >
          <TicketIcon width={moderateScale(26)} height={moderateScale(20)} />
        </Pressable>
      </View>

      {showBanner ? <PromoBanner /> : null}

      {/* 알약 서브탭 */}
      <View
        className="flex-row"
        style={{
          paddingHorizontal: scale(20),
          paddingVertical: verticalScale(10),
          gap: scale(10),
        }}
      >
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
              className="items-center justify-center active:opacity-80"
              style={{
                paddingHorizontal: scale(20),
                height: verticalScale(38),
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? ACCENT : "#D1D5DB",
                backgroundColor: active ? "#EEF2FF" : "#FFFFFF",
              }}
            >
              <Text
                className={active ? "font-semibold" : "font-medium"}
                style={{
                  fontSize: moderateScale(14),
                  color: active ? ACCENT : "#6B7280",
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "upcoming" ? (
        <UpcomingTab current={current} loading={currentLoading} />
      ) : (
        <PastTab />
      )}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* 프로모 배너 — 내일로 패스 등록 유도(예정된 여행 없을 때)             */
/* ------------------------------------------------------------------ */
function PromoBanner() {
  return (
    <View style={{ paddingHorizontal: scale(20), paddingTop: verticalScale(4) }}>
      <View
        className="flex-row items-center"
        style={{
          backgroundColor: "#DCE6FB",
          borderRadius: scale(16),
          paddingHorizontal: scale(18),
          paddingVertical: verticalScale(18),
          gap: scale(12),
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            className="font-bold text-gray-900"
            style={{ fontSize: moderateScale(14), lineHeight: moderateScale(21) }}
          >
            내일로 패스 정보를 등록하고,
          </Text>
          <Text
            className="text-gray-700"
            style={{ fontSize: moderateScale(14), lineHeight: moderateScale(21) }}
          >
            나에게 맞는 여행 계획을 시작해 보세요.
          </Text>
        </View>
        <Text style={{ fontSize: moderateScale(34) }}>🚆</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 예정된 여행 — 현재/예정 여행 1건의 일정표 상세                        */
/* ------------------------------------------------------------------ */
function UpcomingTab({
  current,
  loading,
}: {
  current: HomeTravelCard | null | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={{ paddingHorizontal: scale(20), paddingTop: verticalScale(6) }}>
        <View
          className="items-center"
          style={{
            backgroundColor: "#F5F5F7",
            borderRadius: scale(16),
            paddingVertical: verticalScale(28),
            paddingHorizontal: scale(20),
          }}
        >
          <Text
            className="font-bold text-gray-900"
            style={{ fontSize: moderateScale(16) }}
          >
            아직 등록된 일정이 없어요
          </Text>
          <Text
            className="text-gray-500"
            style={{ fontSize: moderateScale(13), marginTop: verticalScale(6) }}
          >
            지금 바로 나만의 여행 일정을 만들어보세요
          </Text>
          <Pressable
            onPress={() => router.navigate("/course/intro")}
            className="flex-row items-center justify-center bg-white active:opacity-80"
            style={{
              marginTop: verticalScale(18),
              alignSelf: "stretch",
              height: verticalScale(52),
              borderRadius: scale(12),
              gap: scale(6),
              elevation: 2,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
            }}
          >
            <Feather name="plus" size={moderateScale(18)} color={ACCENT} />
            <Text
              className="font-bold"
              style={{ fontSize: moderateScale(15), color: ACCENT }}
            >
              새 여행 일정 만들기
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <TravelDetailView
      travelIdx={current.travel_idx}
      coverImageUrl={current.cover_image_url}
    />
  );
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
        onPressItem={(t) =>
          router.push({
            pathname: "/travel/[travelIdx]",
            params: {
              travelIdx: t.travel_idx,
              cover: t.cover_image_url ?? "",
            },
          })
        }
      />
    </ScrollView>
  );
}
