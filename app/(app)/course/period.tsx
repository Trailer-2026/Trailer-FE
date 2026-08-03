import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { PrimaryButton } from "@/src/features/course/components/PrimaryButton";
import { StepDots } from "@/src/features/course/components/StepDots";
import { StepHeader } from "@/src/features/course/components/StepHeader";
import { addDays, isSameDay, startOfDay } from "@/src/features/course/date";
import { useCourseStore } from "@/src/features/course/store";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const DATE_RANGE = 30; // 오늘부터 선택 가능한 일수

// 숙박 수(nights) → 라벨. 도착일 = 출발일 + nights.
const DURATIONS: { nights: number; label: string }[] = [
  { nights: 0, label: "당일치기" },
  { nights: 1, label: "1박 2일" },
  { nights: 2, label: "2박 3일" },
  { nights: 3, label: "3박 4일" },
  { nights: 4, label: "4박 5일" },
  { nights: 5, label: "5박 6일" },
];

const TEAL = "#B0E6DB";

export default function PeriodScreen() {
  const departDate = useCourseStore((s) => s.departDate);
  const nights = useCourseStore((s) => s.nights);
  const setDepartDate = useCourseStore((s) => s.setDepartDate);
  const setNights = useCourseStore((s) => s.setNights);

  const today = useMemo(() => startOfDay(new Date()), []);
  const dates = useMemo(
    () => Array.from({ length: DATE_RANGE }, (_, i) => addDays(today, i)),
    [today],
  );

  const canProceed = nights !== null;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <StepHeader step={2} steps={4} />

      <View className="flex-1 px-5">
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(20), marginTop: verticalScale(8) }}
        >
          여행기간
        </Text>
        <Text
          className="text-gray-400 font-semibold"
          style={{ fontSize: moderateScale(14), marginTop: verticalScale(6) }}
        >
          기간을 선택해주세요.
        </Text>

        {/* 출발 날짜 (현재 날짜 기반 가로 스트립) */}
        <Text
          className="font-semibold text-gray-800"
          style={{ fontSize: moderateScale(14), marginTop: verticalScale(28) }}
        >
          출발 날짜
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: scale(10), paddingVertical: verticalScale(4) }}
          // 가로 ScrollView 가 세로로 부풀어 남은 공간을 다 먹지 않도록 콘텐츠 높이로 고정.
          // (요일 텍스트 + 6 + 원 40 + 상하패딩 8 ≈ 70dp)
          style={{ marginTop: verticalScale(4), height: verticalScale(74), flexGrow: 0 }}
        >
          {dates.map((d) => {
            const selected = isSameDay(d, departDate);
            const weekday = WEEKDAYS[d.getDay()];
            return (
              <Pressable
                key={d.getTime()}
                onPress={() => setDepartDate(d)}
                className="items-center"
                style={{ width: scale(46) }}
              >
                <Text
                  className="font-semibold"
                  style={{
                    fontSize: moderateScale(12),
                    color: selected ? "#111827" : "#9CA3AF",
                    marginBottom: verticalScale(6),
                  }}
                >
                  {weekday}
                </Text>
                <View
                  className="items-center justify-center"
                  style={{
                    width: scale(40),
                    height: scale(40),
                    borderRadius: 999,
                    // Android: bg 가 transparent → 색으로 바뀔 때 borderRadius 가
                    // 배경에 재적용되지 않아 사각형으로 보이는 버그. overflow 로 강제 클립.
                    overflow: "hidden",
                    backgroundColor: selected ? TEAL : "transparent",
                  }}
                >
                  <Text
                    className="font-semibold"
                    style={{
                      fontSize: moderateScale(15),
                      color: selected ? "#111827" : "#6B7280",
                    }}
                  >
                    {d.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 여행 기간 (숙박 수) */}
        <Text
          className="font-semibold text-gray-800"
          style={{ fontSize: moderateScale(14), marginTop: verticalScale(28) }}
        >
          여행 기간
        </Text>
        <View
          className="flex-row flex-wrap"
          style={{
            marginTop: verticalScale(8),
            marginHorizontal: -scale(6),
            rowGap: verticalScale(12),
          }}
        >
          {DURATIONS.map((d) => {
            const selected = nights === d.nights;
            return (
              <View key={d.nights} className="w-1/2" style={{ paddingHorizontal: scale(6) }}>
                <Pressable
                  onPress={() => setNights(d.nights)}
                  className="items-center justify-center rounded-2xl border"
                  style={{
                    height: verticalScale(84),
                    borderColor: selected ? "#5E84F4" : "#E5E7EB",
                    backgroundColor: selected ? "#F3F4F6" : "#F8F9FA",
                  }}
                >
                  <Text
                    className="font-semibold"
                    style={{
                      fontSize: moderateScale(15),
                      color: selected ? "#5E84F4" : "#4B5563",
                    }}
                  >
                    {d.label}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      <View className="px-5 pb-4">
        <StepDots total={4} index={1} />
        <PrimaryButton
          label="다음"
          onPress={() => router.push("/course/passengers")}
          disabled={!canProceed}
        />
      </View>
    </SafeAreaView>
  );
}
