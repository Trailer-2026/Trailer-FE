import Feather from "@expo/vector-icons/Feather";
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
import PastTravelSections from "@/src/features/travel/components/PastTravelSections";
import TravelListCard from "@/src/features/travel/components/TravelListCard";
import {
  useCurrentTravel,
  usePastTravels,
  useToggleTravelLike,
} from "@/src/features/travel/queries";
import type { PastTravelCard } from "@/src/features/travel/types";
import { useMyStamps } from "@/src/features/stamp/queries";
import { useMyProfile } from "@/src/features/user/queries";
import { HEADER_HEIGHT } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#668DFF";
const HEADER_BG = "#EDF0FB";

// 헤더 배경 + 통계 칩 아이콘 (Figma 에셋)
const MY_BG = require("../../../../assets/images/style/my_background.png");
const STAMP_ICON = require("../../../../assets/images/style/stamp.png");
const VIDEO_ICON = require("../../../../assets/images/style/video.png");

// TODO(stats): 내 영상 개수는 아직 대응 API 가 없다.
const VIDEO_COUNT = 0;

export default function TravelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: profile } = useMyProfile();
  const { data: stamps } = useMyStamps();
  const current = useCurrentTravel();
  const past = usePastTravels();

  const toggleLike = useToggleTravelLike();

  const loading = current.isLoading || past.isLoading;
  const currentTravel = current.data;
  const pastTravels = past.data?.travels ?? [];
  const nickname = profile?.nickname ?? "여행자";

  function handleToggleLike(t: PastTravelCard) {
    toggleLike.mutate(
      { travelIdx: t.travel_idx, currentlyLiked: t.liked },
      { onError: () => Alert.alert("오류", "잠시 후 다시 시도해 주세요.") },
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
        {/* 뒤로 버튼 줄 — 다른 화면 상단바와 같은 높이(44)에 세로 중앙. */}
        <View style={{ height: HEADER_HEIGHT, justifyContent: "center" }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <BackIcon width={moderateScale(12)} height={moderateScale(17)} />
          </Pressable>
        </View>

        <Text
          className="font-bold text-gray-900"
          numberOfLines={1}
          // 뒤로 줄이 상단바 높이(44)로 고정되면서 아래 여백이 남는다 → 그만큼 붙인다.
          style={{ fontSize: moderateScale(24), marginTop: verticalScale(4) }}
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
            value={stamps?.achieved_count ?? 0}
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

          {/* 다녀온 여행 (주요/지난) — 일정 탭과 공통 컴포넌트 */}
          <PastTravelSections
            travels={pastTravels}
            onToggleLike={handleToggleLike}
          />
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
