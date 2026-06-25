import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/features/course/components/PrimaryButton";
import { StepDots } from "@/src/features/course/components/StepDots";
import { useCourseStore } from "@/src/features/course/store";

const RECOMMENDATIONS = [
  { id: "A", badge: "일정 A", title: "서귀포 바닷가 투어", budget: "23,0000원" },
  { id: "B", badge: "일정 B", title: "한라산 트레킹 코스", budget: "18,0000원" },
  { id: "C", badge: "일정 C", title: "성산일출봉 일주", budget: "21,0000원" },
];

const DATE_TABS = [
  { day: "월", date: "20" },
  { day: "화", date: "21" },
];

export default function ResultScreen() {
  const origin = useCourseStore((s) => s.origin);
  const destination = useCourseStore((s) => s.destination);
  const swap = useCourseStore((s) => s.swapOriginDestination);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [dateIndex, setDateIndex] = useState(0);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="chevron-left" size={24} color="#111827" />
          </Pressable>
          <Text className="text-xl font-extrabold text-gray-900">일정 추천</Text>
        </View>
        <Pressable onPress={() => router.replace("/course/loading")}>
          <Text className="text-sm text-gray-500">다시추천받기</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <View className="px-5 mt-2 flex-row items-center justify-center gap-4">
          <Text className="text-xl font-bold text-gray-900">출발 {origin}</Text>
          <Pressable
            onPress={swap}
            className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
          >
            <Feather name="repeat" size={14} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">
            도착 {destination}
          </Text>
        </View>

        <View className="mt-5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 40, gap: 12 }}
            onMomentumScrollEnd={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              setCarouselIndex(Math.round(x / 280));
            }}
          >
            {RECOMMENDATIONS.map((rec) => (
              <View
                key={rec.id}
                className="w-[280px] h-44 bg-gray-200 rounded-2xl p-4 justify-between"
              >
                <View className="bg-white/80 self-start px-2 py-0.5 rounded-md">
                  <Text className="text-xs font-semibold text-gray-700">
                    {rec.badge}
                  </Text>
                </View>
                <View>
                  <Text className="text-lg font-bold text-gray-900">
                    {rec.title}
                  </Text>
                  <Text className="text-xs text-gray-700 mt-1">
                    예산 {rec.budget}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <StepDots total={RECOMMENDATIONS.length} index={carouselIndex} />

        <View className="px-5 mt-2 flex-row gap-2">
          {DATE_TABS.map((tab, i) => {
            const active = i === dateIndex;
            return (
              <Pressable
                key={tab.date}
                onPress={() => setDateIndex(i)}
                className={`flex-1 py-3 rounded-xl items-center ${
                  active ? "bg-gray-800" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-sm ${active ? "text-white" : "text-gray-500"}`}
                >
                  {tab.day} {tab.date}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mx-5 mt-4 h-64 bg-gray-200 rounded-2xl" />
      </ScrollView>

      <View className="px-5 pb-4">
        <PrimaryButton
          label="일정표에 추가하기"
          onPress={() => router.replace("/(tabs)")}
        />
      </View>
    </SafeAreaView>
  );
}
