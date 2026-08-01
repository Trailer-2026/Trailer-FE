import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import TravelDetailView from "@/src/features/travel/components/TravelDetailView";
import { moderateScale } from "@/src/utils/responsive";

/**
 * 여행 일정표 상세 화면(푸시). '다녀온 여행' 목록에서 진입한다.
 * '예정된 여행'(일정 탭)은 같은 TravelDetailView 를 인라인으로 재사용한다.
 */
export default function TravelDetailScreen() {
  const { travelIdx, cover } = useLocalSearchParams<{
    travelIdx?: string;
    cover?: string;
  }>();
  const idx = Number(travelIdx);
  const valid = Number.isFinite(idx);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {valid ? (
        <TravelDetailView
          travelIdx={idx}
          coverImageUrl={cover || null}
          onBack={() => router.back()}
        />
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
