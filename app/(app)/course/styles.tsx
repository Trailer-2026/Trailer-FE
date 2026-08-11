import { router } from "expo-router";
import type { ComponentType } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SvgProps } from "react-native-svg";

import CityIcon from "@/src/components/icons/CityIcon";
import CultureIcon from "@/src/components/icons/CultureIcon";
import FoodIcon from "@/src/components/icons/FoodIcon";
import HealingIcon from "@/src/components/icons/HealingIcon";
import HistoryIcon from "@/src/components/icons/HistoryIcon";
import NatureIcon from "@/src/components/icons/NatureIcon";
import OceanIcon from "@/src/components/icons/OceanIcon";
import ThemeParkIcon from "@/src/components/icons/ThemeParkIcon";
import { Text } from "@/src/components/Text";
import { PrimaryButton } from "@/src/features/course/components/PrimaryButton";
import { StepDots } from "@/src/features/course/components/StepDots";
import { StepHeader } from "@/src/features/course/components/StepHeader";
import { TRAVEL_STYLES, useCourseStore } from "@/src/features/course/store";
import type { Theme } from "@/src/features/course/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

// 각 테마 카드에 붙일 이모지. (아이콘 컴포넌트가 있으면 그쪽이 우선)
const STYLE_EMOJI: Record<Theme, string> = {
  NATURE: "🏔️",
  OCEAN: "🌊",
  HISTORY: "🏛️",
  CITY: "🛒",
  HEALING: "🌿",
  FOOD: "🍴",
  CULTURE: "🎨",
  THEME_PARK: "🎡",
};

// 이모지 대신 SVG 아이콘을 쓰는 테마. 없으면 위 이모지로 폴백.
const STYLE_ICON: Partial<Record<Theme, ComponentType<SvgProps>>> = {
  NATURE: NatureIcon,
  OCEAN: OceanIcon,
  HISTORY: HistoryIcon,
  CITY: CityIcon,
  CULTURE: CultureIcon,
  THEME_PARK: ThemeParkIcon,
  FOOD: FoodIcon,
  HEALING: HealingIcon,
};

export default function StylesScreen() {
  const styles = useCourseStore((s) => s.styles);
  const toggleStyle = useCourseStore((s) => s.toggleStyle);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <StepHeader step={4} steps={4} />

      <View className="flex-1 px-5">
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(20), marginTop: verticalScale(8) }}
        >
          여행스타일 선택
        </Text>
        <Text
          className="text-gray-400 font-semibold"
          style={{ fontSize: moderateScale(14), marginTop: verticalScale(6) }}
        >
          다중 선택이 가능해요.
        </Text>

        {/* 8개 카드 2열 4행. 카드는 w-1/2 유동폭 + 높이 64.
            작은 기기에서 잘리지 않도록 ScrollView 로 감싼다. */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: verticalScale(8) }}
          style={{ marginTop: verticalScale(32) }}
        >
          <View className="flex-row flex-wrap" style={{ marginHorizontal: -scale(6) }}>
            {TRAVEL_STYLES.map(({ theme, label }) => {
              const selected = styles.includes(theme);
              const Icon = STYLE_ICON[theme];
              return (
                <View key={theme} className="w-1/2" style={{ paddingHorizontal: scale(6) }}>
                  <Pressable
                    onPress={() => toggleStyle(theme)}
                    className="flex-row items-center rounded-2xl border"
                    style={{
                      height: verticalScale(64),
                      marginBottom: verticalScale(12),
                      paddingHorizontal: scale(16),
                      gap: scale(10),
                      borderColor: selected ? "#5E84F4" : "#E5E7EB",
                      backgroundColor: selected ? "#F3F4F6" : "#F8F9FA",
                    }}
                  >
                    {Icon ? (
                      <Icon width={moderateScale(24)} height={moderateScale(24)} />
                    ) : (
                      <Text style={{ fontSize: moderateScale(22) }}>
                        {STYLE_EMOJI[theme]}
                      </Text>
                    )}
                    <Text
                      style={{
                        fontSize: moderateScale(14),
                        color: selected ? "#5E84F4" : "#4B5563",
                        fontWeight: 650 as never,
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View className="px-5 pb-4">
        <StepDots total={4} index={3} />
        {styles.length === 0 ? (
          <Text
            className="text-center text-gray-500 font-semibold"
            style={{ fontSize: moderateScale(13), marginBottom: verticalScale(8) }}
          >
            여행스타일을 1개 이상 선택해주세요
          </Text>
        ) : null}
        <PrimaryButton
          label="일정 생성"
          onPress={() => router.push("/course/loading")}
          disabled={styles.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}
