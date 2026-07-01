import { router } from "expo-router";
import { Pressable, View } from "react-native";

import BackIcon from "@/src/components/icons/BackIcon";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

type Props = {
  progress: number;
};

export function StepHeader({ progress }: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View>
      {/* 뒤로가기 */}
      <View
        style={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(6),
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
          <BackIcon width={moderateScale(14)} height={moderateScale(20)} />
        </Pressable>
      </View>

      {/* 진행바 — 화면 왼쪽 끝 ~ 오른쪽 끝, 진행률만큼 채움 */}
      <View
        style={{
          width: "100%",
          height: verticalScale(3),
          backgroundColor: "#EFEFEF",
          marginBottom: verticalScale(16),
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${clamped * 100}%`,
            backgroundColor: "#81E4D0",
          }}
        />
      </View>
    </View>
  );
}
