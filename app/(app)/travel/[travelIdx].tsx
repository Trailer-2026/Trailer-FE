import { router, useLocalSearchParams } from "expo-router";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import TravelDetailView from "@/src/features/travel/components/TravelDetailView";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

/**
 * 여행 일정표 상세 화면(푸시). '다녀온 여행' 목록에서 진입한다.
 * '예정된 여행'(일정 탭)은 같은 TravelDetailView 를 인라인으로 재사용한다.
 */
export default function TravelDetailScreen() {
  const { travelIdx } = useLocalSearchParams<{ travelIdx?: string }>();
  const idx = Number(travelIdx);
  const valid = Number.isFinite(idx);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* 헤더 */}
      <View
        className="flex-row items-center bg-white"
        style={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(6),
          paddingBottom: verticalScale(8),
          gap: scale(10),
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <BackIcon
            color="#111827"
            width={moderateScale(14)}
            height={moderateScale(20)}
          />
        </Pressable>
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(20) }}
        >
          일정표
        </Text>
      </View>

      {valid ? (
        <TravelDetailView travelIdx={idx} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400" style={{ fontSize: moderateScale(14) }}>
            잘못된 여행이에요
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
