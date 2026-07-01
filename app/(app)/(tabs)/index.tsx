import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useState, type ComponentType } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SvgProps } from "react-native-svg";

import AddCircleIcon from "@/src/components/icons/AddCircleIcon";
import CalendarGridIcon from "@/src/components/icons/CalendarGridIcon";
import SubwayIcon from "@/src/components/icons/SubwayIcon";
import TicketIcon from "@/src/components/icons/TicketIcon";
import { Text } from "@/src/components/Text";
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

// 내 여행(승차권 보유 시 1개만 노출) — 그라데이션 카드
const MY_TRIP = {
  title: "부산 여행",
  status: "여행중",
  period: "07.03(토) ~ 07.05(월)",
};

// 안드로이드 카드 입체감용 공통 스타일 (NativeWind shadow-* 가 흐릿하게 보이는 문제 보완)
const CARD_ELEVATION = {
  elevation: 4,
  shadowColor: "#000",
} as const;

export default function HomeScreen() {
  // Zustand 연동 전, 로컬 상태로 티켓 보유 여부 분기
  const [hasTicket, setHasTicket] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <DebugToggle value={hasTicket} onChange={setHasTicket} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: verticalScale(32) }}
      >
        <Header />

        <View style={{ marginTop: verticalScale(8) }}>
          {hasTicket ? <TicketHero /> : <PromoHero />}
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

      {/* 승차권 보유 시: 하단 탭바 위에 떠 있는 내 여행 카드 (피드 위로 겹침) */}
      {hasTicket ? <MyTripCard /> : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* 임시 디버그 토글 (티켓 없음 ↔ 티켓 있음)                            */
/* ------------------------------------------------------------------ */
function DebugToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View
      className="flex-row items-center justify-between bg-yellow-50 border-b border-yellow-200"
      style={{
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(6),
      }}
    >
      <Text className="text-gray-600" style={{ fontSize: moderateScale(12) }}>
        [임시] 티켓 상태: {value ? "있음" : "없음"}
      </Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
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
/* State A: 티켓 없음 — 프로모션 히어로                                 */
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
/* State B: 티켓 있음 — 예약 승차권 카드                                */
/* ------------------------------------------------------------------ */
function TicketHero() {
  return (
    <View style={{ height: verticalScale(227), paddingHorizontal: scale(20) }}>
      <Text
        className="text-gray-900 font-bold"
        style={{ fontSize: moderateScale(15), marginBottom: verticalScale(12) }}
      >
        승차권 2매가 예약되었어요.
      </Text>

      <View style={{ flex: 1 }}>
        <View
          className="bg-white overflow-hidden"
          style={{ flex: 1, borderRadius: scale(16), ...CARD_ELEVATION }}
        >
        {/* 상단 민트 바 */}
        <View
          style={{
            backgroundColor: "#81E4D0",
            paddingHorizontal: scale(14),
            paddingVertical: verticalScale(8),
          }}
        >
          <Text
            className="text-white font-semibold"
            style={{ fontSize: moderateScale(12) }}
          >
            내일로 2.0 선택 3일권 YOUTH
          </Text>
        </View>

        {/* 본문: 출발 → 도착 (카드 잔여 높이 채움) */}
        <View
          className="flex-row items-center justify-center"
          style={{
            flex: 1,
            gap: scale(18),
          }}
        >
          <View className="items-center">
            <Text
              className="text-gray-400"
              style={{ fontSize: moderateScale(11) }}
            >
              출발
            </Text>
            <Text
              className="text-gray-900 font-bold"
              style={{ fontSize: moderateScale(24), marginTop: verticalScale(2) }}
            >
              서울
            </Text>
          </View>

          <MaterialCommunityIcons
            name="arrow-right"
            size={moderateScale(30)}
            color="#5E84F4"
          />

          <View className="items-center">
            <Text
              className="text-gray-400"
              style={{ fontSize: moderateScale(11) }}
            >
              도착
            </Text>
            <Text
              className="text-gray-900 font-bold"
              style={{ fontSize: moderateScale(24), marginTop: verticalScale(2) }}
            >
              부산
            </Text>
          </View>
        </View>
      </View>

        {/* 카드 우측 상단 코너에 겹쳐진 배지 (35 x 35) */}
        <View
          className="absolute items-center justify-center"
          style={{
            top: -verticalScale(14),
            right: -scale(10),
            width: scale(35),
            height: scale(35),
            borderRadius: scale(35) / 2,
            backgroundColor: "#5E84F4",
            borderWidth: scale(2),
            borderColor: "#FFFFFF",
            ...CARD_ELEVATION,
          }}
        >
          <Text
            className="text-white font-bold"
            style={{ fontSize: moderateScale(14) }}
          >
            2
          </Text>
        </View>
      </View>
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
/* 내 여행 카드 (승차권 보유 시 1개만) — 그라데이션 320 x 77            */
/* ------------------------------------------------------------------ */
function MyTripCard() {
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
          className="bg-white rounded-full"
          style={{ width: scale(48), height: scale(48) }}
        />
        <View className="flex-1">
          <Text
            className="text-white font-medium"
            style={{ fontSize: moderateScale(17) }}
          >
            {MY_TRIP.title}
          </Text>
          <Text
            className="text-white"
            style={{ fontSize: moderateScale(14), marginTop: verticalScale(2) }}
          >
            {MY_TRIP.status} | {MY_TRIP.period}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="calendar-blank-outline"
          size={moderateScale(22)}
          color="#FFFFFF"
        />
      </LinearGradient>
    </View>
  );
}
