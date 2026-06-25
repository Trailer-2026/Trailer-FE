import { router } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Counter } from "@/src/features/course/components/Counter";
import { PrimaryButton } from "@/src/features/course/components/PrimaryButton";
import { StepDots } from "@/src/features/course/components/StepDots";
import { StepHeader } from "@/src/features/course/components/StepHeader";
import { PassengerKey, useCourseStore } from "@/src/features/course/store";

const ROWS: { key: PassengerKey; title: string; sub: string; min: number }[] = [
  { key: "adult", title: "성인", sub: "만 18세 이상", min: 1 },
  { key: "teen", title: "청소년", sub: "만 18세 미만", min: 0 },
  { key: "child", title: "어린이", sub: "만 12세 미만", min: 0 },
];

export default function PassengersScreen() {
  const passengers = useCourseStore((s) => s.passengers);
  const setPassenger = useCourseStore((s) => s.setPassenger);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <StepHeader progress={2 / 3} />

      <View className="flex-1 px-5">
        <Text className="mt-2 text-2xl font-extrabold text-gray-900">
          여행인원 선택
        </Text>

        <View className="mt-6 gap-3">
          {ROWS.map((row) => (
            <View
              key={row.key}
              className="flex-row items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <View>
                <Text className="text-base font-semibold text-gray-900">
                  {row.title}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">{row.sub}</Text>
              </View>
              <Counter
                value={passengers[row.key]}
                min={row.min}
                onChange={(delta) => setPassenger(row.key, delta)}
              />
            </View>
          ))}
        </View>
      </View>

      <View className="px-5 pb-4">
        <StepDots total={3} index={1} />
        <PrimaryButton
          label="다음"
          onPress={() => router.push("/course/styles")}
        />
      </View>
    </SafeAreaView>
  );
}
