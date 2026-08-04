import Feather from "@expo/vector-icons/Feather";
import { Pressable, View } from "react-native";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { formatLongDate } from "../format";

const CARD_BG = "#F1F4FB";

/**
 * 여행 요약 카드 — 배지 + 제목 + 기간 + ⋮.
 * 예정된 여행(D-day)과 다녀온 여행(완료·체크)이 배지만 달리해 공용으로 쓴다.
 * 카드를 누르면 일정표 상세로 이동한다.
 */
export default function TravelSummaryCard({
  badge,
  badgeColor,
  badgeTextColor = "#FFFFFF",
  showCheck = false,
  fixedBadge = false,
  title,
  startDate,
  endDate,
  onPress,
  onMenuPress,
}: {
  badge: string;
  badgeColor: string;
  /** 배지 글씨·체크 색 (기본 흰색) */
  badgeTextColor?: string;
  /** 배지 앞에 체크 표시 */
  showCheck?: boolean;
  /** 배지를 70x28 고정 크기로 */
  fixedBadge?: boolean;
  title: string;
  startDate: string;
  endDate: string;
  onPress: () => void;
  /** ⋮ 를 누르면 호출. 주지 않으면 버튼 무동작(TODO 상태 유지). */
  onMenuPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-80"
      style={{
        width: scale(311),
        height: verticalScale(123),
        alignSelf: "center",
        borderRadius: scale(16),
        backgroundColor: CARD_BG,
        paddingHorizontal: scale(18),
        paddingVertical: verticalScale(18),
      }}
    >
      <View className="flex-row items-center justify-between">
        <View
          className="flex-row items-center rounded-full"
          style={
            fixedBadge
              ? {
                  backgroundColor: badgeColor,
                  width: scale(70),
                  height: verticalScale(28),
                  justifyContent: "center",
                  gap: scale(3),
                }
              : {
                  backgroundColor: badgeColor,
                  paddingHorizontal: scale(12),
                  paddingVertical: verticalScale(4),
                  gap: scale(3),
                }
          }
        >
          {showCheck ? (
            <Feather name="check" size={moderateScale(13)} color={badgeTextColor} />
          ) : null}
          <Text
            className="font-bold"
            style={{ fontSize: moderateScale(13), color: badgeTextColor }}
          >
            {badge}
          </Text>
        </View>
        <Pressable
          onPress={onMenuPress}
          hitSlop={10}
          disabled={!onMenuPress}
          className="active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="여행 메뉴"
        >
          <Feather name="more-vertical" size={moderateScale(18)} color="#9CA3AF" />
        </Pressable>
      </View>

      <Text
        className="font-bold text-gray-900"
        style={{ fontSize: moderateScale(18), marginTop: verticalScale(8) }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        className="text-gray-500"
        style={{ fontSize: moderateScale(13), marginTop: verticalScale(6) }}
      >
        {formatLongDate(startDate)} ~ {formatLongDate(endDate)}
      </Text>
    </Pressable>
  );
}
