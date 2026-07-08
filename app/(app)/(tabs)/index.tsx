import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useState, type ComponentType } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SvgProps } from "react-native-svg";

import AddCircleIcon from "@/src/components/icons/AddCircleIcon";
import CalendarGridIcon from "@/src/components/icons/CalendarGridIcon";
import SubwayIcon from "@/src/components/icons/SubwayIcon";
import TicketIcon from "@/src/components/icons/TicketIcon";
import { Text } from "@/src/components/Text";
import {
  formatTravelPeriod,
  travelStatusLabel,
} from "@/src/features/travel/format";
import { useCurrentTravel } from "@/src/features/travel/queries";
import type {
  HomeTravelCard,
  TravelStatus,
} from "@/src/features/travel/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

// Figma 내보내기 아이콘 에셋 (Metro 는 대소문자 구분 — 실제 파일명 케이스와 정확히 일치시킬 것)
const ICONS = {
  ticket: require("../../../assets/images/Ticket.png"),
  main: require("../../../assets/images/Main.png"),
};

// 흑백 처리용 틴트 컬러
const GRAY_TINT = "#4B5563"; // 퀵메뉴 아이콘
const TOOLTIP_COLOR = "#5E84F4"; // AI 일정 만들기 말풍선

type QuickMenuKey = "ticket" | "train" | "compass" | "food";
type SvgIcon = ComponentType<SvgProps>;

const QUICK_MENU: {
  key: QuickMenuKey;
  label: string;
  Svg?: SvgIcon;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  size: number; // Figma px 기준 아이콘 크기
}[] = [
  { key: "ticket", label: "승차권 예매", Svg: TicketIcon, size: 37 },
  { key: "train", label: "열차위치", Svg: SubwayIcon, size: 39 },
  { key: "compass", label: "", icon: "compass-outline", size: 26 },
  { key: "food", label: "", icon: "silverware-fork-knife", size: 26 },
];

// 실시간 여행 피드(추천) 카드 — 임의 배경 이미지 + 캡션
const FEED_CARDS = [
  { id: "1", caption: "경주에서 해볼만한 것" },
  { id: "2", caption: "부산에서 20대가 노는 곳" },
  { id: "3", caption: "여수 밤바다 즐기기" },
];

// 안드로이드 카드 입체감용 공통 스타일 (NativeWind shadow-* 가 흐릿하게 보이는 문제 보완)
const CARD_ELEVATION = {
  elevation: 4,
  shadowColor: "#000",
} as const;

export default function HomeScreen() {
  const { data: currentTravel, isLoading } = useCurrentTravel();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: verticalScale(32) }}
      >
        <Header />

        <View style={{ marginTop: verticalScale(8) }}>
          {isLoading ? (
            <HeroPlaceholder />
          ) : currentTravel ? (
            <CurrentTravelHero travel={currentTravel} />
          ) : (
            <PromoHero />
          )}
        </View>

        <View style={{ paddingHorizontal: scale(20), marginTop: verticalScale(24) }}>
          <QuickMenu />
        </View>

        <View style={{ paddingHorizontal: scale(20), marginTop: verticalScale(28) }}>
          <SectionHeader />
        </View>

        <View style={{ marginTop: verticalScale(14) }}>
          <FeedCarousel />
        </View>
      </ScrollView>

      {/* 진행중·예정 여행이 있으면 하단 탭바 위에 떠 있는 요약 카드 */}
      {currentTravel ? <CurrentTravelFloatingCard travel={currentTravel} /> : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* 헤더                                                                */
/* ------------------------------------------------------------------ */
function Header() {
  return (
    <View
      className="flex-row items-center justify-between"
      style={{
        paddingHorizontal: scale(20),
        paddingTop: verticalScale(6),
        paddingBottom: verticalScale(4),
      }}
    >
      <Text
        className="font-medium text-gray-900"
        style={{ fontSize: moderateScale(17) }}
      >
        트레일러
      </Text>
      <View className="flex-row items-center" style={{ gap: scale(16) }}>
        {/* Group 대신: 하단바 3번째와 동일한 캘린더(격자) 아이콘 (역할은 다름) */}
        <CalendarGridIcon
          color="#353535"
          width={moderateScale(22)}
          height={moderateScale(22)}
        />

        {/* Vector 대신: 원+플러스 */}
        <AddCircleIcon width={moderateScale(30)} height={moderateScale(30)} />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 로딩 중 히어로 자리 (스켈레톤)                                       */
/* ------------------------------------------------------------------ */
function HeroPlaceholder() {
  return (
    <View
      className="items-center justify-center bg-gray-100"
      style={{ height: verticalScale(198) }}
    >
      <ActivityIndicator color="#9CA3AF" />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* State A: 여행 없음 — 프로모션 히어로                                 */
/* ------------------------------------------------------------------ */
function PromoHero() {
  return (
    <View>
      {/* 배경 이미지 배너 (기차탭) 360 x 198 */}
      <View
        className="overflow-hidden"
        style={{ height: verticalScale(198), ...CARD_ELEVATION }}
      >
        <ImageBackground
          source={ICONS.main}
          resizeMode="cover"
          style={{ flex: 1 }}
        >
          {/* AI 일정추천 — Bold 12, X19 / Y122 */}
          <Text
            className="text-teal-400 font-bold"
            style={{
              position: "absolute",
              left: scale(19),
              top: verticalScale(122),
              fontSize: moderateScale(12),
            }}
          >
            AI 일정추천
          </Text>

          {/* 본문 — 16, X19 / Y147.5, 165.5 */}
          <Text
            className="text-white font-bold"
            style={{
              position: "absolute",
              left: scale(19),
              top: verticalScale(147.5),
              fontSize: moderateScale(16),
            }}
          >
            내일로패스 끊고
          </Text>
          <Text
            className="text-white font-bold"
            style={{
              position: "absolute",
              left: scale(19),
              top: verticalScale(165.5),
              fontSize: moderateScale(16),
            }}
          >
            여행의 순간을 즐겨요
          </Text>

          {/* 우하단 인디케이터 배지 */}
          <View
            className="absolute flex-row items-center bg-black/40 rounded-full"
            style={{
              bottom: verticalScale(14),
              right: scale(14),
              paddingHorizontal: scale(12),
              paddingVertical: verticalScale(5),
              gap: scale(6),
            }}
          >
            <Text
              className="text-white font-semibold"
              style={{ fontSize: moderateScale(14) }}
            >
              1/3
            </Text>
            <MaterialCommunityIcons
              name="plus"
              size={moderateScale(15)}
              color="#FFFFFF"
            />
          </View>
        </ImageBackground>
      </View>

      {/* AI 일정 만들기 말풍선 (94 x 30) — 일정 아이콘 바로 밑, 꼬리 중앙 */}
      <View
        style={{
          position: "absolute",
          top: -verticalScale(13),
          // 말풍선 중앙을 일정(캘린더) 아이콘 중앙에 맞춤
          right:
            scale(20) +
            moderateScale(30) +
            scale(16) +
            moderateScale(11) -
            scale(94) / 2,
          alignItems: "center",
          zIndex: 10,
        }}
      >
        {/* 꼬리 (위로 향하는 삼각형) — 말풍선 정중앙 */}
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: scale(6),
            borderRightWidth: scale(6),
            borderBottomWidth: verticalScale(7),
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: TOOLTIP_COLOR,
          }}
        />
        {/* 말풍선 본체 */}
        <View
          style={{
            width: scale(94),
            height: verticalScale(30),
            backgroundColor: TOOLTIP_COLOR,
            borderRadius: scale(14),
            alignItems: "center",
            justifyContent: "center",
            elevation: 8,
            shadowColor: "#000",
          }}
        >
          <Text
            className="text-white font-semibold"
            numberOfLines={1}
            style={{ fontSize: moderateScale(12) }}
          >
            AI 일정 만들기
          </Text>
        </View>
      </View>

      {/* 내일로 패스 예약하기 — 360 x 29, #F2F2F2 */}
      <Pressable
        className="flex-row items-center justify-center"
        style={{
          height: verticalScale(29),
          backgroundColor: "#F2F2F2",
          gap: scale(6),
        }}
      >
        <Image
          source={ICONS.ticket}
          resizeMode="contain"
          style={{ width: moderateScale(16), height: moderateScale(16) }}
        />
        <Text
          className="text-gray-700 font-medium"
          style={{ fontSize: moderateScale(12) }}
        >
          내일로 패스 예약하기
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={moderateScale(14)}
          color="#6B7280"
        />
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* State B: 여행 있음 — 현재 여행 히어로                                 */
/*   title, 기간, status 배지, cover_image_url (없으면 placeholder)     */
/* ------------------------------------------------------------------ */
function CurrentTravelHero({ travel }: { travel: HomeTravelCard }) {
  return (
    <Pressable
      onPress={() => {
        // TODO(travel-detail): travel_idx 로 상세 화면 이동 (다음 범위).
      }}
    >
      <TravelCoverImage
        uri={travel.cover_image_url}
        style={{ height: verticalScale(198), ...CARD_ELEVATION }}
      >
        {/* 어둡게 오버레이 — 텍스트 가독성 */}
        <View
          style={{
            ...StyleSheetAbsolute,
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        />
        <View
          style={{
            position: "absolute",
            left: scale(20),
            right: scale(20),
            bottom: verticalScale(18),
          }}
        >
          <StatusBadge status={travel.status} />
          <Text
            className="text-white font-bold"
            style={{
              fontSize: moderateScale(20),
              marginTop: verticalScale(8),
            }}
            numberOfLines={2}
          >
            {travel.title}
          </Text>
          <Text
            className="text-white"
            style={{
              fontSize: moderateScale(13),
              marginTop: verticalScale(4),
              opacity: 0.9,
            }}
          >
            {formatTravelPeriod(travel.start_date, travel.end_date)}
          </Text>
        </View>
      </TravelCoverImage>
    </Pressable>
  );
}

const StyleSheetAbsolute = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

/** cover_image_url 이 있으면 원격 이미지, 없거나 로드 실패 시 Main.png 배경. */
function TravelCoverImage({
  uri,
  style,
  children,
}: {
  uri: string | null;
  style: object;
  children?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const useRemote = !!uri && !failed;
  return (
    <View className="overflow-hidden" style={style}>
      {useRemote ? (
        <ImageBackground
          source={{ uri: uri! }}
          resizeMode="cover"
          style={{ flex: 1 }}
          onError={() => setFailed(true)}
        >
          {children}
        </ImageBackground>
      ) : (
        <ImageBackground
          source={ICONS.main}
          resizeMode="cover"
          style={{ flex: 1 }}
        >
          {children}
        </ImageBackground>
      )}
    </View>
  );
}

function StatusBadge({ status }: { status: TravelStatus }) {
  const bg: Record<TravelStatus, string> = {
    PLANNED: "#5E84F4",
    ONGOING: "#22C55E",
    COMPLETED: "#6B7280",
  };
  return (
    <View
      className="self-start rounded-full"
      style={{
        backgroundColor: bg[status],
        paddingHorizontal: scale(10),
        paddingVertical: verticalScale(3),
      }}
    >
      <Text
        className="text-white font-semibold"
        style={{ fontSize: moderateScale(11) }}
      >
        {travelStatusLabel(status)}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 4분할 퀵 메뉴                                                       */
/* ------------------------------------------------------------------ */
function QuickMenu() {
  return (
    <View className="flex-row justify-between">
      {QUICK_MENU.map((item) => {
        const Icon = item.Svg;
        const tile = (
          <View className="items-center">
            <View
              className="bg-gray-200 items-center justify-center"
              style={{
                width: scale(56),
                height: scale(56),
                borderRadius: scale(12),
              }}
            >
              {Icon ? (
                <Icon
                  width={moderateScale(item.size)}
                  height={moderateScale(item.size)}
                />
              ) : (
                <MaterialCommunityIcons
                  name={item.icon!}
                  size={moderateScale(item.size)}
                  color={GRAY_TINT}
                />
              )}
            </View>
            {item.label ? (
              <Text
                className="text-gray-700"
                style={{
                  fontSize: moderateScale(12),
                  marginTop: verticalScale(8),
                }}
              >
                {item.label}
              </Text>
            ) : null}
          </View>
        );

        if (item.key === "ticket") {
          return (
            <Link key={item.key} href="/course/origin-destination" asChild>
              <Pressable>{tile}</Pressable>
            </Link>
          );
        }

        return <Pressable key={item.key}>{tile}</Pressable>;
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 실시간 여행 피드                                                    */
/* ------------------------------------------------------------------ */
function SectionHeader() {
  return (
    <View>
      <Text
        className="font-semibold"
        style={{ color: "#668DFF", fontSize: moderateScale(14) }}
      >
        실시간 여행 피드
      </Text>
      <Text
        className="text-gray-900 font-bold"
        style={{ fontSize: moderateScale(20), marginTop: verticalScale(4) }}
      >
        지금 사람들이 떠나는 여행 보기
      </Text>
    </View>
  );
}

function FeedCarousel() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: scale(20),
        gap: scale(12),
      }}
    >
      {FEED_CARDS.map((card) => (
        <FeedCard key={card.id} {...card} />
      ))}
    </ScrollView>
  );
}

function FeedCard({ caption }: { caption: string }) {
  return (
    <View
      className="overflow-hidden"
      style={{
        width: scale(168),
        height: verticalScale(250),
        borderRadius: scale(16),
        ...CARD_ELEVATION,
      }}
    >
      {/* TODO: 임의 배경(Main.png 임시) — 추후 카드별 실제 이미지로 교체 */}
      <ImageBackground
        source={ICONS.main}
        resizeMode="cover"
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        {/* 우상단 더보기 */}
        <View
          className="absolute"
          style={{ top: verticalScale(10), right: scale(10) }}
        >
          <MaterialCommunityIcons
            name="dots-vertical"
            size={moderateScale(20)}
            color="#FFFFFF"
          />
        </View>

        {/* 하단 캡션 (가독성용 어두운 오버레이) */}
        <View
          className="bg-black/40"
          style={{
            paddingHorizontal: scale(12),
            paddingVertical: verticalScale(12),
          }}
        >
          <Text
            className="text-white font-semibold"
            style={{ fontSize: moderateScale(15) }}
          >
            {caption}
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 현재 여행 요약 카드 (하단 플로팅, 320 x 77) — 그라데이션              */
/* ------------------------------------------------------------------ */
function CurrentTravelFloatingCard({ travel }: { travel: HomeTravelCard }) {
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: verticalScale(27),
        paddingHorizontal: scale(20),
        zIndex: 20,
      }}
    >
      <Pressable
        onPress={() => {
          // TODO(travel-detail): travel_idx 로 상세 화면 이동 (다음 범위).
        }}
      >
        <LinearGradient
          colors={["#668DFF", "#81D0E4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: verticalScale(77),
            flexDirection: "row",
            alignItems: "center",
            borderRadius: scale(16),
            paddingHorizontal: scale(14),
            gap: scale(12),
            elevation: 8,
            shadowColor: "#000",
          }}
        >
          <View
            className="bg-white rounded-full overflow-hidden"
            style={{ width: scale(48), height: scale(48) }}
          >
            {travel.cover_image_url ? (
              <Image
                source={{ uri: travel.cover_image_url }}
                resizeMode="cover"
                style={{ width: "100%", height: "100%" }}
              />
            ) : null}
          </View>
          <View className="flex-1">
            <Text
              className="text-white font-medium"
              numberOfLines={1}
              style={{ fontSize: moderateScale(17) }}
            >
              {travel.title}
            </Text>
            <Text
              className="text-white"
              numberOfLines={1}
              style={{ fontSize: moderateScale(14), marginTop: verticalScale(2) }}
            >
              {travelStatusLabel(travel.status)} |{" "}
              {formatTravelPeriod(travel.start_date, travel.end_date)}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="calendar-blank-outline"
            size={moderateScale(22)}
            color="#FFFFFF"
          />
        </LinearGradient>
      </Pressable>
    </View>
  );
}
