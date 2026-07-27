import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { formatDotDate, travelStatusLabel } from "@/src/features/travel/format";
import {
  useCurrentTravel,
  usePastTravels,
  useToggleTravelLike,
} from "@/src/features/travel/queries";
import type {
  HomeTravelCard,
  PastTravelCard,
} from "@/src/features/travel/types";
import { useMyProfile } from "@/src/features/user/queries";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#668DFF";
const HEADER_BG = "#EDF0FB";
const HEART_ON = "#FF3B5C";
const HEART_OFF = "#C4C9D4";

// 헤더 배경 + 통계 칩 아이콘 (Figma 에셋)
const MY_BG = require("../../../../assets/images/style/my_background.png");
const STAMP_ICON = require("../../../../assets/images/style/stamp.png");
const VIDEO_ICON = require("../../../../assets/images/style/video.png");

// TODO(stats): 스탬프·내영상 개수 API 연동 시 교체 (현재 프로필 응답엔 없음)
const STAMP_COUNT = 0;
const VIDEO_COUNT = 0;

export default function TravelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: profile } = useMyProfile();
  const current = useCurrentTravel();
  const past = usePastTravels();

  const toggleLike = useToggleTravelLike();

  const loading = current.isLoading || past.isLoading;
  const currentTravel = current.data;
  const pastTravels = past.data?.travels ?? [];
  const nickname = profile?.nickname ?? "여행자";

  // 좋아요한 여행은 "주요 여행", 나머지는 "지난 여행"으로 분리
  const majorTravels = pastTravels.filter((t) => t.liked);
  const pastOnly = pastTravels.filter((t) => !t.liked);

  function handleToggleLike(t: PastTravelCard) {
    toggleLike.mutate(
      { travelIdx: t.travel_idx, currentlyLiked: t.liked },
      {
        onError: () =>
          Alert.alert("오류", "잠시 후 다시 시도해 주세요."),
      },
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* 라벤더 헤더 — 배경 이미지(my_background) 위, 상태바 뒤까지 채움 */}
      <ImageBackground
        source={MY_BG}
        resizeMode="cover"
        style={{
          backgroundColor: HEADER_BG, // 이미지 로드 전/여백 폴백
          paddingTop: insets.top + verticalScale(6),
          paddingHorizontal: scale(20),
          paddingBottom: verticalScale(20),
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <BackIcon width={moderateScale(12)} height={moderateScale(17)} />
        </Pressable>

        <Text
          className="font-bold text-gray-900"
          numberOfLines={1}
          style={{ fontSize: moderateScale(24), marginTop: verticalScale(20) }}
        >
          {nickname}
        </Text>

        {/* 통계 칩 (스탬프 · 내영상) */}
        <View
          className="flex-row"
          style={{ marginTop: verticalScale(16), gap: scale(12) }}
        >
          <StatPill
            icon={
              <Image
                source={STAMP_ICON}
                style={{ width: moderateScale(20), height: moderateScale(20) }}
                contentFit="contain"
              />
            }
            label="스탬프"
            value={STAMP_COUNT}
          />
          <StatPill
            icon={
              <Image
                source={VIDEO_ICON}
                style={{ width: moderateScale(20), height: moderateScale(20) }}
                contentFit="contain"
              />
            }
            label="내영상"
            value={VIDEO_COUNT}
          />
        </View>
      </ImageBackground>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: scale(20),
            paddingTop: verticalScale(16),
            paddingBottom: verticalScale(24),
          }}
        >
          {/* 현재 여행 있으면 카드, 없으면 새 일정 만들기 카드 */}
          {currentTravel ? (
            <TravelListCard travel={currentTravel} />
          ) : (
            <NewTravelCard onPress={() => router.push("/course/intro")} />
          )}

          {/* 주요 여행 (좋아요한 여행) */}
          {majorTravels.length > 0 ? (
            <>
              <SectionTitle>주요 여행</SectionTitle>
              {majorTravels.map((t) => (
                <TravelListCard
                  key={t.travel_idx}
                  travel={t}
                  liked={t.liked}
                  onToggleLike={() => handleToggleLike(t)}
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
                  onToggleLike={() => handleToggleLike(t)}
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
                <Text
                  className="text-gray-400"
                  style={{ fontSize: moderateScale(14) }}
                >
                  아직 지난 여행이 없어요
                </Text>
              </View>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 통계 칩 (아이콘 + 라벨 + 개수)                                        */
/* ------------------------------------------------------------------ */
function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <View
      className="bg-white flex-row items-center justify-center"
      style={{
        width: scale(129),
        height: verticalScale(41),
        borderRadius: verticalScale(20),
        gap: scale(8),
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      }}
    >
      {icon}
      <Text
        className="text-gray-700 font-medium"
        style={{ fontSize: moderateScale(14) }}
      >
        {label}
      </Text>
      <Text
        className="font-bold"
        style={{ fontSize: moderateScale(15), color: ACCENT }}
      >
        {value}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 섹션 제목 (주요 여행 / 지난 여행)                                     */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* 여행 카드 (썸네일 + 날짜 + 제목 + 상태 배지 + 하트)                    */
/*   liked 를 넘기면 하트 표시. onToggleLike 가 있으면 눌러서 좋아요 토글.  */
/*   현재 여행엔 liked 가 없어 하트 자체를 렌더하지 않는다.                */
/* ------------------------------------------------------------------ */
function TravelListCard({
  travel,
  liked,
  onToggleLike,
}: {
  travel: HomeTravelCard | PastTravelCard;
  liked?: boolean;
  onToggleLike?: () => void;
}) {
  return (
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
          <Text
            className="text-gray-500"
            style={{ fontSize: moderateScale(11) }}
          >
            {travelStatusLabel(travel.status)}
          </Text>
        </View>
      </View>

      {/* 하트 — 눌러서 좋아요 토글. liked 없으면(현재 여행) 렌더 안 함 */}
      {liked !== undefined ? (
        <Pressable
          onPress={onToggleLike}
          disabled={!onToggleLike}
          hitSlop={10}
        >
          <MaterialCommunityIcons
            name={liked ? "heart" : "heart-outline"}
            size={moderateScale(24)}
            color={liked ? HEART_ON : HEART_OFF}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 현재 여행 없음 — 새 여행 일정 만들기 카드                             */
/* ------------------------------------------------------------------ */
function NewTravelCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#E8EDFF" }}
      className="flex-row items-center"
      style={{
        backgroundColor: "#F5F5F7",
        borderRadius: scale(16),
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(16),
        gap: scale(12),
      }}
    >
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: scale(30),
          height: scale(30),
          backgroundColor: ACCENT,
        }}
      >
        <Feather name="plus" size={moderateScale(18)} color="#FFFFFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(16) }}
        >
          새 여행 일정 만들기
        </Text>
        <Text
          className="text-gray-400"
          style={{ fontSize: moderateScale(13), marginTop: verticalScale(3) }}
        >
          새로운 여행을 떠나보세요
        </Text>
      </View>
    </Pressable>
  );
}
