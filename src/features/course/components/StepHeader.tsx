import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { Text } from "@/src/components/Text";
import BackIcon from "@/src/components/icons/BackIcon";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

type Props = {
  /** 0~1 진행률. step/steps 를 주면 무시되고 step/steps 로 계산. */
  progress?: number;
  /** 현재 단계(1부터). steps 와 함께 주면 우상단에 "step/steps" 라벨 + 진행바 표시. */
  step?: number;
  steps?: number;
};

// step 기반 진행바는 마지막 단계에서 꽉 채우지 않고 최대 95% 까지만 채운다.
// (각 단계는 이 비율에 맞춰 스케일 → 4/4 = 95%, 3/4 = 71.25% ...)
const MAX_FILL = 0.95;

export function StepHeader({ progress, step, steps }: Props) {
  const hasLabel = typeof step === "number" && typeof steps === "number";
  const ratio = hasLabel ? (step! / steps!) * MAX_FILL : (progress ?? 0);
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View>
      {/* 뒤로가기 + 단계 라벨 */}
      <View
        className="flex-row items-center justify-between"
        style={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(16),
          paddingBottom: verticalScale(10),
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{
            width: scale(28),
            height: scale(28),
            justifyContent: "center",
          }}
        >
          <BackIcon width={moderateScale(12)} height={moderateScale(17)} />
        </Pressable>

        {hasLabel ? (
          <Text
            className="font-semibold"
            style={{ fontSize: moderateScale(17), color: "#5E84F4" }}
          >
            {step}/{steps}
          </Text>
        ) : null}
      </View>

      {/* 진행바 — 화면 왼쪽 끝 ~ 오른쪽 끝, 진행률만큼 채움 */}
      <View
        style={{
          width: "100%",
          height: verticalScale(5),
          backgroundColor: "#EFEFEF",
          marginTop: verticalScale(8),
          marginBottom: verticalScale(30),
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${clamped * 100}%`,
            backgroundColor: "#B0E6DB",
          }}
        />
      </View>
    </View>
  );
}
