import { router } from "expo-router";
import { View } from "react-native";
import { Text } from "@/src/components/Text";
import { SafeAreaView } from "react-native-safe-area-context";

import { Counter } from "@/src/features/course/components/Counter";
import { PrimaryButton } from "@/src/features/course/components/PrimaryButton";
import { StepDots } from "@/src/features/course/components/StepDots";
import { StepHeader } from "@/src/features/course/components/StepHeader";
import { PassengerKey, useCourseStore } from "@/src/features/course/store";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ROWS: { key: PassengerKey; title: string; sub: string }[] = [
  { key: "adult", title: "성인", sub: "만 18세 이상" },
  { key: "teen", title: "청소년", sub: "만 18세 미만" },
  { key: "child", title: "어린이", sub: "만 12세 미만" },
];

export default function PassengersScreen() {
  const passengers = useCourseStore((s) => s.passengers);
  const setPassenger = useCourseStore((s) => s.setPassenger);

  const total = passengers.adult + passengers.teen + passengers.child;
  const canProceed = total > 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <StepHeader step={3} steps={4} />

      <View className="flex-1 px-5">
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(20), marginTop: verticalScale(8) }}
        >
          여행인원
        </Text>

        <View style={{ marginTop: verticalScale(24), gap: verticalScale(16) }}>
          {ROWS.map((row) => (
            <View
              key={row.key}
              className="flex-row items-center justify-between bg-white border border-gray-200"
              style={{
                height: verticalScale(82),
                borderRadius: scale(28),
                paddingHorizontal: scale(22),
              }}
            >
              <View>
                <Text
                  className="font-semibold text-gray-900"
                  style={{ fontSize: moderateScale(18) }}
                >
                  {row.title}
                </Text>
                <Text
                  className="font-semibold"
                  style={{
                    fontSize: moderateScale(12),
                    color: "#ADADAD",
                    marginTop: verticalScale(2),
                  }}
                >
                  {row.sub}
                </Text>
              </View>
              <Counter
                value={passengers[row.key]}
                min={0}
                onChange={(delta) => setPassenger(row.key, delta)}
              />
            </View>
          ))}
        </View>
      </View>

      <View className="px-5 pb-4">
        <StepDots total={4} index={2} />
        {!canProceed ? (
          <Text
            className="text-center text-gray-500 font-semibold"
            style={{ fontSize: moderateScale(13), marginBottom: verticalScale(8) }}
          >
            여행 인원을 1명 이상 선택해주세요
          </Text>
        ) : null}
        <PrimaryButton
          label="다음"
          onPress={() => router.push("/course/styles")}
          disabled={!canProceed}
        />
      </View>
    </SafeAreaView>
  );
}
