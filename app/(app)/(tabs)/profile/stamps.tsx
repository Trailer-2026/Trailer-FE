import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { useMyStamps } from "@/src/features/stamp/queries";
import type { Stamp } from "@/src/features/stamp/types";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";
const BAND_BG = "#EDF0FB";
const CARD_BG = "#E8EFFC";

const PAD = scale(20);
const GAP = scale(12);
const COLS = 3;

/**
 * 마이페이지 > 스탬프.
 *
 * 서버가 미달성 칸까지 정렬해 내려주므로 응답 순서 그대로 그린다(앱이 정렬하지 않음).
 * achieved=false 인 칸만 흐리게 + 자물쇠를 덮는다.
 */
export default function StampsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data, isLoading, error, refetch } = useMyStamps();

  // 3열 그리드 — 좌우 여백과 칸 사이 간격을 뺀 나머지를 균등 분할.
  const cardSize = (width - PAD * 2 - GAP * (COLS - 1)) / COLS;

  return (
    <View className="flex-1 bg-white">
      {/* 헤더 */}
      <View
        className="flex-row items-center"
        style={{ ...headerBarStyle(insets.top), paddingHorizontal: scale(16) }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{ padding: scale(4) }}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <BackIcon width={moderateScale(12)} height={moderateScale(17)} />
        </Pressable>
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(17), marginLeft: scale(8) }}
        >
          스탬프
        </Text>
      </View>

      {/* 달성 현황 띠 */}
      <View
        className="flex-row items-baseline"
        style={{
          backgroundColor: BAND_BG,
          paddingHorizontal: PAD,
          paddingVertical: verticalScale(26),
          gap: scale(10),
        }}
      >
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(15) }}
        >
          배지 달성 현황
        </Text>
        <Text
          className="font-bold"
          style={{ fontSize: moderateScale(24), color: ACCENT }}
        >
          {data ? `${data.achieved_count}개` : "-"}
        </Text>
      </View>

      {isLoading ? (
        <Centered>
          <ActivityIndicator color={ACCENT} />
        </Centered>
      ) : error || !data ? (
        <Centered>
          <Text
            className="font-semibold text-gray-900"
            style={{ fontSize: moderateScale(15) }}
          >
            스탬프를 불러오지 못했어요
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="bg-gray-800 rounded-full active:opacity-80"
            style={{
              marginTop: verticalScale(12),
              paddingHorizontal: scale(20),
              paddingVertical: verticalScale(10),
            }}
          >
            <Text
              className="text-white font-semibold"
              style={{ fontSize: moderateScale(14) }}
            >
              다시 시도
            </Text>
          </Pressable>
        </Centered>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: PAD,
            paddingTop: verticalScale(24),
            paddingBottom: verticalScale(32),
          }}
        >
          <View
            className="flex-row flex-wrap"
            style={{ gap: GAP, rowGap: verticalScale(20) }}
          >
            {data.stamps.map((stamp) => (
              <StampCell key={stamp.type} stamp={stamp} size={cardSize} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 스탬프 한 칸 (이미지 카드 + 아래 이름)                                 */
/* ------------------------------------------------------------------ */
function StampCell({ stamp, size }: { stamp: Stamp; size: number }) {
  const [failed, setFailed] = useState(false);
  const locked = !stamp.achieved;
  // 진행도가 있는 잠긴 스탬프만 "3/10" 을 자물쇠 아래 보여준다(1회성 스탬프는 생략).
  const showProgress = locked && stamp.goal > 1;

  return (
    <View style={{ width: size }}>
      <View
        className="items-center justify-center"
        style={{
          width: size,
          height: size,
          backgroundColor: CARD_BG,
          borderRadius: scale(12),
          overflow: "hidden",
        }}
      >
        {failed ? (
          <Feather name="award" size={size * 0.34} color="#B7C4E4" />
        ) : (
          <Image
            source={{ uri: stamp.image_url }}
            contentFit="contain"
            onError={() => setFailed(true)}
            style={{
              width: size * 0.66,
              height: size * 0.66,
              // 잠긴 칸은 흐리게 — 자물쇠가 잘 읽히도록.
              opacity: locked ? 0.28 : 1,
            }}
          />
        )}

        {locked ? (
          <View
            className="absolute items-center justify-center"
            style={{ left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <Feather name="lock" size={size * 0.26} color="#8FA3CE" />
            {showProgress ? (
              <Text
                className="font-bold"
                style={{
                  fontSize: moderateScale(11),
                  color: "#8FA3CE",
                  marginTop: verticalScale(4),
                }}
              >
                {stamp.progress}/{stamp.goal}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* 이름 — 2줄 자리를 고정해 아래 줄 카드들이 어긋나지 않게 한다. */}
      <Text
        className={locked ? "text-gray-400 text-center" : "text-gray-800 text-center"}
        numberOfLines={2}
        style={{
          marginTop: verticalScale(10),
          fontSize: moderateScale(12),
          lineHeight: moderateScale(17),
          height: moderateScale(34),
        }}
      >
        {stamp.title}
      </Text>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ paddingHorizontal: scale(24) }}
    >
      {children}
    </View>
  );
}
