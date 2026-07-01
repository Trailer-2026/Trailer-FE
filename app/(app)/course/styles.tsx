import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Text } from "@/src/components/Text";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/features/course/components/PrimaryButton";
import { StepDots } from "@/src/features/course/components/StepDots";
import { StepHeader } from "@/src/features/course/components/StepHeader";
import { TRAVEL_STYLES, useCourseStore } from "@/src/features/course/store";

const GRID_SLOTS = 6;

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

        <View className="mt-6 flex-row flex-wrap -mx-1.5">
          {Array.from({ length: GRID_SLOTS }).map((_, i) => {
            const value = TRAVEL_STYLES[i];
            const selected = value ? styles.includes(value) : false;
            return (
              <View key={i} className="w-1/2 px-1.5 mb-4">
                <Pressable
                  disabled={!value}
                  onPress={() => value && toggleStyle(value)}
                  className={`h-36 rounded-2xl items-center justify-center border ${
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
                  {value ? (
                    <Text
                      className={`text-base font-semibold ${
                        selected ? "text-gray-900" : "text-gray-600"
                      }`}
                    >
                      {value}
                    </Text>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      <View className="px-5 pb-4">
        <StepDots total={3} index={2} />
        <PrimaryButton
          label="다음"
          onPress={() => router.push("/course/loading")}
        />
      </View>
    </SafeAreaView>
  );
}
