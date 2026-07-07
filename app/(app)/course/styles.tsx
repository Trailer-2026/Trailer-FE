import { router } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { PrimaryButton } from "@/src/features/course/components/PrimaryButton";
import { StepDots } from "@/src/features/course/components/StepDots";
import { StepHeader } from "@/src/features/course/components/StepHeader";
import { TRAVEL_STYLES, useCourseStore } from "@/src/features/course/store";

export default function StylesScreen() {
  const styles = useCourseStore((s) => s.styles);
  const toggleStyle = useCourseStore((s) => s.toggleStyle);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <StepHeader progress={1} />

      <View className="flex-1 px-5">
        <Text className="mt-2 text-2xl font-extrabold text-gray-900">
          여행스타일 선택
        </Text>
        <Text className="mt-1 text-sm text-gray-500">
          다중 선택이 가능해요
        </Text>

        {/* 8개 카드 4행. 화면이 작은 기기에서 잘리지 않도록 ScrollView 로 감싼다. */}
        <ScrollView
          className="mt-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          <View className="flex-row flex-wrap -mx-1.5">
            {TRAVEL_STYLES.map(({ theme, label }) => {
              const selected = styles.includes(theme);
              return (
                <View key={theme} className="w-1/2 px-1.5 mb-4">
                  <Pressable
                    onPress={() => toggleStyle(theme)}
                    className={`h-28 rounded-2xl items-center justify-center border ${
                      selected
                        ? "border-gray-800 bg-gray-100"
                        : "border-gray-200 bg-white"
                    }`}
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: selected ? 0.1 : 0.05,
                      shadowRadius: 6,
                      elevation: selected ? 3 : 1,
                    }}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        selected ? "text-gray-900" : "text-gray-600"
                      }`}
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
        <StepDots total={3} index={2} />
        {styles.length === 0 ? (
          <Text className="text-center text-sm text-gray-500 mb-2">
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
