import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { usePlaceDetail } from "@/src/features/place/queries";
import type { NearbyRestaurant } from "@/src/features/place/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";
const BOX_BG = "#F1F4FB";
const PAD = scale(20);

/** 소개 사진 캐러셀 — 다음 장이 살짝 보이도록 화면보다 좁게. */
const HERO_GAP = scale(10);

/**
 * 여행지 상세 — 홈 '테마별 여행지' 카드에서 진입.
 *
 * 지역 소개(사진·주소·가까운 역·소개글)와 가까운 맛집을 한 화면에 담는다.
 * 맛집/역은 서버에서 실패해도 빈 배열·null 로 오므로 각각 없으면 그 영역만 숨긴다.
 */
export default function PlaceDetailScreen() {
  const { contentId } = useLocalSearchParams<{ contentId?: string }>();
  const { width } = useWindowDimensions();
  const { data, isLoading, error, refetch } = usePlaceDetail(contentId);

  const heroW = width - PAD * 2;
  const cardW = (width - PAD * 2 - scale(12)) / 2;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      {/* 닫기 — 홈에서 올라온 화면이라 뒤로가 아니라 X */}
      <View style={{ paddingHorizontal: PAD, paddingTop: verticalScale(8) }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="items-center justify-center rounded-full active:opacity-70"
          style={{
            width: scale(30),
            height: scale(30),
            backgroundColor: "#D9DCE1",
          }}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        >
          <Feather name="x" size={moderateScale(17)} color="#FFFFFF" />
        </Pressable>
      </View>

      {isLoading ? (
        <Centered>
          <ActivityIndicator color={ACCENT} />
        </Centered>
      ) : error || !data ? (
        <Centered>
          <Text
            className="text-gray-900"
            style={{ fontSize: moderateScale(15), fontWeight: 650 as never }}
          >
            여행지 정보를 불러오지 못했어요
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
              className="text-white"
              style={{ fontSize: moderateScale(14), fontWeight: 650 as never }}
            >
              다시 시도
            </Text>
          </Pressable>
        </Centered>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: verticalScale(32) }}
        >
          {/* 큰 제목 — "주제, 장소명" 을 두 줄로 나눠 장소명을 강조한다. */}
          <Headline headline={data.headline} name={data.name} />

          {/* 사진 캐러셀 — 대표 사진이 첫 장 */}
          {data.images.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={heroW + HERO_GAP}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: PAD, gap: HERO_GAP }}
              style={{ marginTop: verticalScale(8) }}
            >
              {data.images.map((uri, i) => (
                <Image
                  key={`${uri}-${i}`}
                  source={{ uri }}
                  contentFit="cover"
                  style={{
                    width: heroW,
                    height: verticalScale(190),
                    borderRadius: scale(10),
                    backgroundColor: "#E5E7EB",
                  }}
                />
              ))}
            </ScrollView>
          ) : null}

          {/* 주소 · 가까운 역 */}
          <View
            style={{
              paddingHorizontal: PAD,
              marginTop: verticalScale(20),
              gap: verticalScale(14),
            }}
          >
            <InfoRow icon="map-pin">{data.address}</InfoRow>
            {/* 1.5km 안에 역이 없으면 null → 줄 자체를 숨긴다(제주·산간 등). */}
            {data.nearest_station ? (
              <InfoRow icon="corner-up-left" emphasized>
                {data.nearest_station.text}
              </InfoRow>
            ) : null}
          </View>

          {/* 소개글 */}
          {data.overview ? <Overview text={data.overview} /> : null}

          {/* 가까운 맛집 — 조회 실패 시 빈 배열이라 섹션째 숨긴다. */}
          {data.restaurants.length > 0 ? (
            <>
              <Text
                className="text-gray-900"
                style={{
                  paddingHorizontal: PAD,
                  marginTop: verticalScale(32),
                  fontSize: moderateScale(17),
                  fontWeight: 650 as never,
                }}
              >
                가까운 맛집
              </Text>
              <View
                className="flex-row flex-wrap"
                style={{
                  paddingHorizontal: PAD,
                  marginTop: verticalScale(16),
                  gap: scale(12),
                  // 주소가 2줄 자리를 고정으로 차지하므로 줄 간격은 좁게 잡는다.
                  rowGap: verticalScale(12),
                }}
              >
                {data.restaurants.map((r) => (
                  <RestaurantCard
                    key={r.content_id}
                    restaurant={r}
                    width={cardW}
                  />
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/**
 * 상단 제목 — 서버 headline 은 "아름다운 숲과 자연의 도시, 갑천" 처럼
 * "주제, 장소명" 한 문장으로 온다. 마지막 쉼표에서 잘라 두 줄로 나누고,
 * 앞의 주제는 한 단계 얇게 둬 장소명이 눈에 먼저 들어오게 한다.
 *
 * 쉼표가 없거나 뒤쪽이 비면 나누지 않고 headline 을 그대로 쓴다(문구 형식이 달라져도 안전).
 */
function Headline({ headline, name }: { headline: string; name: string }) {
  const cut = headline.lastIndexOf(",");
  const topic = cut > 0 ? headline.slice(0, cut).trim() : null;
  const title = cut > 0 ? headline.slice(cut + 1).trim() || name : headline;

  return (
    <View style={{ paddingHorizontal: PAD, marginTop: verticalScale(14) }}>
      {topic ? (
        <Text
          className="text-gray-900"
          style={{
            fontSize: moderateScale(18),
            lineHeight: moderateScale(26),
            fontWeight: 600,
          }}
        >
          {topic},
        </Text>
      ) : null}
      <Text
        className="text-gray-900"
        style={{
          fontSize: moderateScale(18),
          lineHeight: moderateScale(26),
          fontWeight: 650 as never,
        }}
      >
        {title}
      </Text>
    </View>
  );
}

/** 접힌 상태에서 보여줄 줄 수. 이보다 짧으면 버튼 자체를 만들지 않는다. */
const OVERVIEW_COLLAPSED_LINES = 5;

/**
 * 소개글 — 5줄이 넘으면 접고 '더보기'로 편다.
 *
 * 실제로 몇 줄인지는 렌더해봐야 알 수 있어서, onTextLayout 으로 잰 줄 수가
 * 기준을 넘을 때만 버튼을 노출한다(짧은 글에 '더보기'가 뜨는 걸 막는다).
 * numberOfLines 가 걸린 상태에서도 onTextLayout 은 잘린 줄 수만 주므로,
 * 첫 측정은 제한 없이 하고 그 뒤에 접는다.
 */
function Overview({ text }: { text: string }) {
  const [lineCount, setLineCount] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const measured = lineCount !== null;
  const needsToggle = measured && lineCount > OVERVIEW_COLLAPSED_LINES;
  const collapsed = needsToggle && !expanded;

  return (
    <View
      style={{
        marginHorizontal: PAD,
        marginTop: verticalScale(22),
        backgroundColor: BOX_BG,
        borderRadius: scale(8),
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(18),
      }}
    >
      <Text
        className="text-gray-700"
        // 측정 전에는 제한을 걸지 않는다 — 걸어두면 실제 줄 수를 알 수 없다.
        numberOfLines={collapsed ? OVERVIEW_COLLAPSED_LINES : undefined}
        onTextLayout={(e) => {
          if (lineCount === null) setLineCount(e.nativeEvent.lines.length);
        }}
        style={{
          fontSize: moderateScale(13),
          lineHeight: moderateScale(21),
          // 측정 프레임에 전문이 번쩍 보이지 않도록 잠깐 감춘다.
          opacity: measured ? 1 : 0,
        }}
      >
        {text}
      </Text>

      {needsToggle ? (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          hitSlop={8}
          className="flex-row items-center active:opacity-60"
          style={{ marginTop: verticalScale(10), gap: scale(4) }}
          accessibilityRole="button"
        >
          <Text
            style={{
              fontSize: moderateScale(12),
              color: ACCENT,
              fontWeight: 650 as never,
            }}
          >
            {expanded ? "접기" : "더보기"}
          </Text>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={moderateScale(14)}
            color={ACCENT}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

/** 아이콘 + 텍스트 한 줄(주소, 가까운 역). */
function InfoRow({
  icon,
  emphasized,
  children,
}: {
  icon: keyof typeof Feather.glyphMap;
  /** 가까운 역은 한 단계 강조 */
  emphasized?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center" style={{ gap: scale(10) }}>
      <Feather name={icon} size={moderateScale(16)} color={ACCENT} />
      <Text
        className="flex-1 text-gray-800"
        style={{
          fontSize: moderateScale(13),
          ...(emphasized ? { fontWeight: 650 as never } : null),
        }}
      >
        {children}
      </Text>
    </View>
  );
}

/** 맛집 카드 — 사진 + 이름 + "분류 | 주소". */
function RestaurantCard({
  restaurant,
  width,
}: {
  restaurant: NearbyRestaurant;
  width: number;
}) {
  return (
    <View style={{ width }}>
      <View
        className="overflow-hidden items-center justify-center"
        style={{
          width,
          height: width * 0.78,
          borderRadius: scale(8),
          backgroundColor: "#E5E7EB",
        }}
      >
        {restaurant.image_url ? (
          <Image
            source={{ uri: restaurant.image_url }}
            contentFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <Feather
            name="image"
            size={moderateScale(22)}
            color="#B7C0DA"
          />
        )}
      </View>

      <Text
        className="text-gray-900"
        numberOfLines={1}
        style={{
          marginTop: verticalScale(10),
          fontSize: moderateScale(14),
          fontWeight: 650 as never,
        }}
      >
        {restaurant.name}
      </Text>
      {/* 주소가 길어도 잘리지 않게 2줄까지. 줄 수가 달라도 아랫줄 카드가
          어긋나지 않도록 2줄 높이를 고정한다. */}
      <Text
        className="text-gray-400"
        numberOfLines={2}
        style={{
          fontSize: moderateScale(11),
          lineHeight: moderateScale(16),
          height: moderateScale(32),
          marginTop: verticalScale(4),
        }}
      >
        {restaurant.category} | {shortAddress(restaurant.address)}
      </Text>
    </View>
  );
}

/**
 * "대전광역시 유성구 어은로52번길 5 (어은동)" → "유성구 어은로52번길 5"
 * 카드 폭이 좁아 시/도와 괄호 보조 표기는 떼고 구·상세만 남긴다.
 */
function shortAddress(address: string): string {
  const withoutParen = address.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const parts = withoutParen.split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : withoutParen;
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
