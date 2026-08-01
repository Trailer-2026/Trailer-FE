import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { formatDotDate, travelStatusLabel } from "../format";
import type { HomeTravelCard, PastTravelCard } from "../types";

const HEART_ON = "#FF3B5C";
const HEART_OFF = "#C4C9D4";

/**
 * 여행 카드(썸네일 + 날짜 + 제목 + 상태 배지 + 하트).
 * 프로필 '여행기록' 과 일정 탭 '다녀온 여행' 이 공통으로 쓴다.
 *
 * - liked 를 넘기면 하트 표시. onToggleLike 가 있으면 눌러서 좋아요 토글.
 *   현재 여행(HomeTravelCard)엔 liked 가 없어 하트 자체를 렌더하지 않는다.
 * - onPress 가 있으면 카드 전체를 눌러 상세로 이동(하트 영역은 이벤트 분리).
 */
export default function TravelListCard({
  travel,
  liked,
  onToggleLike,
  onPress,
}: {
  travel: HomeTravelCard | PastTravelCard;
  liked?: boolean;
  onToggleLike?: () => void;
  onPress?: () => void;
}) {
  const body = (
    <View
      className="flex-row items-center"
      style={{ paddingVertical: verticalScale(12), gap: scale(14) }}
    >
      {/* 썸네일 (여행 첫 일정 대표 이미지) */}
      <View
        className="bg-gray-100 overflow-hidden items-center justify-center"
        style={{ width: scale(73), height: scale(73), borderRadius: scale(12) }}
      >
        {travel.cover_image_url ? (
          <Image
            source={{ uri: travel.cover_image_url }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <Feather name="image" size={moderateScale(24)} color="#C4C9D4" />
        )}
      </View>

      {/* 날짜 · 제목 · 상태 배지 */}
      <View style={{ flex: 1 }}>
        <Text className="text-gray-400" style={{ fontSize: moderateScale(13) }}>
          {formatDotDate(travel.end_date)}
        </Text>
        <Text
          className="font-bold text-gray-900"
          numberOfLines={1}
          style={{ fontSize: moderateScale(18), marginTop: verticalScale(2) }}
        >
          {travel.title}
        </Text>
        <View
          className="self-start bg-gray-100"
          style={{
            marginTop: verticalScale(6),
            paddingHorizontal: scale(8),
            paddingVertical: verticalScale(3),
            borderRadius: scale(6),
          }}
        >
          <Text className="text-gray-500" style={{ fontSize: moderateScale(11) }}>
            {travelStatusLabel(travel.status)}
          </Text>
        </View>
      </View>

      {/* 하트 — 눌러서 좋아요 토글. liked 없으면(현재 여행) 렌더 안 함 */}
      {liked !== undefined ? (
        <Pressable onPress={onToggleLike} disabled={!onToggleLike} hitSlop={10}>
          <MaterialCommunityIcons
            name={liked ? "heart" : "heart-outline"}
            size={moderateScale(24)}
            color={liked ? HEART_ON : HEART_OFF}
          />
        </Pressable>
      ) : null}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      {body}
    </Pressable>
  );
}
