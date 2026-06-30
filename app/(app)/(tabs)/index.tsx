import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

// Figma 내보내기 아이콘 에셋 (Metro 는 대소문자 구분 — 실제 파일명 케이스와 정확히 일치시킬 것)
const ICONS = {
  ticket: require("../../../assets/images/Ticket.png"),
  subway: require("../../../assets/images/Subway.png"),
  group: require("../../../assets/images/Group.png"),
  vector: require("../../../assets/images/Vector.png"),
};

// 흑백 처리용 틴트 컬러
const GRAY_TINT = "#4B5563"; // 퀵메뉴 아이콘
const HEADER_TINT = "#374151"; // 헤더 아이콘

type QuickMenuKey = "ticket" | "train" | "compass" | "food";

const QUICK_MENU: {
  key: QuickMenuKey;
  label: string;
  image?: ImageSourcePropType;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  size: number; // Figma px 기준 아이콘 크기
}[] = [
  { key: "ticket", label: "승차권 예매", image: ICONS.ticket, size: 37 },
  { key: "train", label: "열차위치", image: ICONS.subway, size: 34 },
  { key: "compass", label: "", icon: "compass-outline", size: 26 },
  { key: "food", label: "", icon: "silverware-fork-knife", size: 26 },
];

const FEED_CARDS = [
  { id: "1", title: "부산 여행", status: "여행중", period: "07.03(토) ~ 07.05(월)" },
  { id: "2", title: "강릉 여행", status: "여행중", period: "07.04(일) ~ 07.06(화)" },
  { id: "3", title: "여수 여행", status: "예정", period: "07.10(수) ~ 07.12(금)" },
];

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

        <View style={{ paddingHorizontal: scale(20), marginTop: verticalScale(8) }}>
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
        className="font-bold text-gray-900"
        style={{ fontSize: moderateScale(22) }}
      >
        트레일러
      </Text>
      <View className="flex-row items-center" style={{ gap: scale(16) }}>
        <Image
          source={ICONS.group}
          resizeMode="contain"
          style={{
            width: moderateScale(24),
            height: moderateScale(24),
            tintColor: HEADER_TINT,
          }}
        />
        <Image
          source={ICONS.vector}
          resizeMode="contain"
          style={{
            width: moderateScale(24),
            height: moderateScale(24),
            tintColor: HEADER_TINT,
          }}
        />
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
      <View
        className="bg-gray-400 overflow-hidden"
        style={{
          height: verticalScale(170),
          borderTopLeftRadius: scale(16),
          borderTopRightRadius: scale(16),
          padding: scale(16),
          ...CARD_ELEVATION,
        }}
      >
        {/* 좌상단 라벨 */}
        <Text
          className="text-white font-semibold"
          style={{ fontSize: moderateScale(12) }}
        >
          AI 일정추천
        </Text>

        {/* 우상단 툴팁 캡슐 */}
        <View
          className="absolute bg-gray-800 rounded-full"
          style={{
            top: verticalScale(14),
            right: scale(14),
            paddingHorizontal: scale(12),
            paddingVertical: verticalScale(5),
          }}
        >
          <Text className="text-white" style={{ fontSize: moderateScale(11) }}>
            AI 일정 만들기
          </Text>
        </View>

        {/* 본문 텍스트 */}
        <View style={{ marginTop: verticalScale(20) }}>
          <Text
            className="text-white font-bold"
            style={{ fontSize: moderateScale(18), lineHeight: moderateScale(26) }}
          >
            내일로패스 끊고
          </Text>
          <Text
            className="text-white font-bold"
            style={{ fontSize: moderateScale(18), lineHeight: moderateScale(26) }}
          >
            여행의 순간을 즐겨요
          </Text>
        </View>

        {/* 우하단 인디케이터 배지 */}
        <View
          className="absolute flex-row items-center bg-black/40 rounded-full"
          style={{
            bottom: verticalScale(14),
            right: scale(14),
            paddingHorizontal: scale(10),
            paddingVertical: verticalScale(3),
            gap: scale(6),
          }}
        >
          <Text className="text-white" style={{ fontSize: moderateScale(11) }}>
            1/3
          </Text>
          <MaterialCommunityIcons
            name="plus"
            size={moderateScale(13)}
            color="#FFFFFF"
          />
        </View>
      </View>

      {/* 배너 바로 아래: 내일로 패스 예약하기 버튼 */}
      <Pressable
        className="flex-row items-center justify-center bg-gray-100"
        style={{
          paddingVertical: verticalScale(12),
          borderBottomLeftRadius: scale(16),
          borderBottomRightRadius: scale(16),
          gap: scale(6),
        }}
      >
        <Image
          source={ICONS.ticket}
          resizeMode="contain"
          style={{ width: moderateScale(18), height: moderateScale(18) }}
        />
        <Text
          className="text-gray-700 font-medium"
          style={{ fontSize: moderateScale(13) }}
        >
          내일로 패스 예약하기
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={moderateScale(16)}
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
    <View>
      <Text
        className="text-gray-900 font-bold"
        style={{ fontSize: moderateScale(15), marginBottom: verticalScale(12) }}
      >
        승차권 2매가 예약되었어요.
      </Text>

      <View
        className="bg-white overflow-hidden"
        style={{ borderRadius: scale(16), ...CARD_ELEVATION }}
      >
        {/* 상단 민트 바 */}
        <View
          className="bg-teal-400"
          style={{
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

        {/* 본문: 출발 → 도착 */}
        <View
          className="flex-row items-center justify-between"
          style={{
            paddingHorizontal: scale(20),
            paddingVertical: verticalScale(22),
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
            size={moderateScale(24)}
            color="#111827"
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

      {/* 카드 우상단에 겹쳐진 블루 배지 */}
      <View
        className="absolute bg-blue-500 rounded-full items-center justify-center"
        style={{
          top: verticalScale(22),
          right: scale(-6),
          width: scale(28),
          height: scale(28),
          ...CARD_ELEVATION,
        }}
      >
        <Text
          className="text-white font-bold"
          style={{ fontSize: moderateScale(13) }}
        >
          2
        </Text>
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
              {item.image ? (
                <Image
                  source={item.image}
                  resizeMode="contain"
                  style={{
                    width: moderateScale(item.size),
                    height: moderateScale(item.size),
                    tintColor: GRAY_TINT,
                  }}
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
      <Text className="text-gray-400" style={{ fontSize: moderateScale(12) }}>
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

function FeedCard({
  title,
  status,
  period,
}: {
  title: string;
  status: string;
  period: string;
}) {
  return (
    <View
      className="bg-gray-300 overflow-hidden"
      style={{
        width: scale(280),
        height: verticalScale(230),
        borderRadius: scale(16),
        ...CARD_ELEVATION,
      }}
    >
      {/* 좌상단 아바타 */}
      <View
        className="absolute bg-gray-100 rounded-full"
        style={{
          top: verticalScale(12),
          left: scale(12),
          width: scale(36),
          height: scale(36),
        }}
      />

      {/* 우상단 더보기 */}
      <View
        className="absolute"
        style={{ top: verticalScale(12), right: scale(12) }}
      >
        <MaterialCommunityIcons
          name="dots-vertical"
          size={moderateScale(20)}
          color="#FFFFFF"
        />
      </View>

      {/* 하단 어두운 오버레이 + 파란 캡슐 블록 */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-black/40 justify-end"
        style={{
          height: verticalScale(96),
          padding: scale(10),
        }}
      >
        <View
          className="flex-row items-center bg-blue-500"
          style={{
            borderRadius: scale(14),
            paddingHorizontal: scale(10),
            paddingVertical: verticalScale(8),
            gap: scale(8),
            ...CARD_ELEVATION,
          }}
        >
          <View
            className="bg-white rounded-full"
            style={{ width: scale(32), height: scale(32) }}
          />
          <View className="flex-1">
            <Text
              className="text-white font-bold"
              style={{ fontSize: moderateScale(14) }}
            >
              {title}
            </Text>
            <Text
              className="text-white"
              style={{ fontSize: moderateScale(11), marginTop: verticalScale(2) }}
            >
              {status} | {period}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="calendar-blank-outline"
            size={moderateScale(18)}
            color="#FFFFFF"
          />
        </View>
      </View>
    </View>
  );
}
