import { View } from "react-native";

import { Text } from "@/src/components/Text";
import { moderateScale, verticalScale } from "@/src/utils/responsive";

import type { PastTravelCard } from "../types";
import TravelListCard from "./TravelListCard";

/**
 * 다녀온(지난) 여행 목록을 "주요 여행"(좋아요한 것) / "지난 여행" 두 섹션으로 나눠 렌더.
 * 프로필 '여행기록' 과 일정 탭 '다녀온 여행' 이 공통으로 사용한다.
 *
 * - travels 한 목록을 liked 값으로 나눈다(별도 API 아님).
 * - onToggleLike: 하트 토글. onPressItem: 카드 탭 시 상세 이동(없으면 비탭).
 */
export default function PastTravelSections({
  travels,
  onToggleLike,
  onPressItem,
}: {
  travels: PastTravelCard[];
  onToggleLike: (travel: PastTravelCard) => void;
  onPressItem?: (travel: PastTravelCard) => void;
}) {
  const majorTravels = travels.filter((t) => t.liked);
  const pastOnly = travels.filter((t) => !t.liked);

  return (
    <>
      {/* 주요 여행 (좋아요한 여행) */}
      {majorTravels.length > 0 ? (
        <>
          <SectionTitle>주요 여행</SectionTitle>
          {majorTravels.map((t) => (
            <TravelListCard
              key={t.travel_idx}
              travel={t}
              liked={t.liked}
              onToggleLike={() => onToggleLike(t)}
              onPress={onPressItem ? () => onPressItem(t) : undefined}
            />
          ))}
        </>
      ) : null}

      {/* 지난 여행 */}
      {pastOnly.length > 0 ? (
        <>
          <SectionTitle>지난 여행</SectionTitle>
          {pastOnly.map((t) => (
            <TravelListCard
              key={t.travel_idx}
              travel={t}
              liked={t.liked}
              onToggleLike={() => onToggleLike(t)}
              onPress={onPressItem ? () => onPressItem(t) : undefined}
            />
          ))}
        </>
      ) : majorTravels.length === 0 ? (
        <>
          <SectionTitle>지난 여행</SectionTitle>
          <View
            className="items-center justify-center"
            style={{ paddingVertical: verticalScale(48) }}
          >
            <Text className="text-gray-400" style={{ fontSize: moderateScale(14) }}>
              아직 지난 여행이 없어요
            </Text>
          </View>
        </>
      ) : null}
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      className="font-bold text-gray-900"
      style={{
        fontSize: moderateScale(16),
        marginTop: verticalScale(24),
        marginBottom: verticalScale(4),
      }}
    >
      {children}
    </Text>
  );
}
