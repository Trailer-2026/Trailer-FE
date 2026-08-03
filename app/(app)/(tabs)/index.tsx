import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AddCircleIcon from "@/src/components/icons/AddCircleIcon";
import CalendarGridIcon from "@/src/components/icons/CalendarGridIcon";
import ThemeSwapIcon from "@/src/components/icons/ThemeSwapIcon";
import { Text } from "@/src/components/Text";
import type { Theme } from "@/src/features/course/types";
import { useThemedPlaces } from "@/src/features/place/queries";
import type { ThemePlaceCard } from "@/src/features/place/types";
import {
  formatTravelPeriod,
  travelStatusLabel,
} from "@/src/features/travel/format";
import { useCurrentTravel } from "@/src/features/travel/queries";
import type { HomeTravelCard } from "@/src/features/travel/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

// Figma 내보내기 아이콘 에셋 (Metro 는 대소문자 구분 — 실제 파일명 케이스와 정확히 일치시킬 것)
const ICONS = {
  ticket: require("../../../assets/images/Ticket.png"),
  main: require("../../../assets/images/Main.png"),
};

const TOOLTIP_COLOR = "#5E84F4"; // 상단 + 아래 말풍선
const TOOLTIP_W = scale(100);
// 말풍선 문구 — 홈에 들어올 때마다 번갈아 노출.
const TOOLTIP_MESSAGES = ["AI 일정 만들기", "여행영상 만들기"] as const;

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
  const { data: currentTravel } = useCurrentTravel();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: verticalScale(32) }}
      >
        <Header />

        {/* 여행 유무와 무관하게 메인 이미지 유지 — 현재 여행은 하단 플로팅 카드로 안내 */}
        <View style={{ marginTop: verticalScale(8) }}>
          <PromoHero />
        </View>

        <View style={{ paddingHorizontal: scale(20), marginTop: verticalScale(28) }}>
          <SectionHeader />
        </View>

        <View style={{ marginTop: verticalScale(14) }}>
          <FeedCarousel />
        </View>

        <View style={{ marginTop: verticalScale(28) }}>
          <ThemedPlacesSection />
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
        height: verticalScale(44),
      }}
    >
      <Text
        className="font-bold text-gray-900"
        style={{ fontSize: moderateScale(20) }}
      >
        트레일러
      </Text>
      <View className="flex-row items-center" style={{ gap: scale(16) }}>
        {/* 일정(격자) 아이콘 → 일정(코스 추천) 만들기 */}
        <Pressable
          onPress={() => router.push("/course/intro")}
          hitSlop={10}
          className="active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="일정 만들기"
        >
          <CalendarGridIcon
            color="#353535"
            width={moderateScale(22)}
            height={moderateScale(22)}
          />
        </Pressable>

        {/* + → 여행영상 만들기 */}
        <Pressable
          onPress={() => router.push("/reels/create")}
          hitSlop={10}
          className="active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="여행영상 만들기"
        >
          <AddCircleIcon width={moderateScale(30)} height={moderateScale(30)} />
        </Pressable>
      </View>
    </View>
  );
}


/* ------------------------------------------------------------------ */
/* State A: 여행 없음 — 프로모션 히어로                                 */
/* ------------------------------------------------------------------ */
function PromoHero() {
  const [msgIdx, setMsgIdx] = useState(0);
  // 홈을 떠날 때 다음 문구로 넘겨, 다시 들어오면 번갈아 보이게 한다(초기 진입 깜빡임 없음).
  useFocusEffect(
    useCallback(() => {
      return () => setMsgIdx((i) => (i + 1) % TOOLTIP_MESSAGES.length);
    }, []),
  );
  const tooltip = TOOLTIP_MESSAGES[msgIdx];
  // "여행영상 만들기"는 + 아이콘 아래, "AI 일정 만들기"는 일정(캘린더) 아이콘 아래.
  const underPlus = tooltip === TOOLTIP_MESSAGES[1];

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
              top: verticalScale(40),
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
              top: verticalScale(65.5),
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
              top: verticalScale(83.5),
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
              paddingHorizontal: scale(10),
              paddingVertical: verticalScale(4),
              gap: scale(4),
            }}
          >
            <Text
              className="text-white font-semibold"
              style={{ fontSize: moderateScale(12) }}
            >
              1/3
            </Text>
            <MaterialCommunityIcons
              name="plus"
              size={moderateScale(13)}
              color="#FFFFFF"
            />
          </View>
        </ImageBackground>
      </View>

      {/* 말풍선 — 문구에 따라 위치만 다르고, 둘 다 같은 CSS 텍스트(font-semibold) */}
      <View
        style={{
          position: "absolute",
          top: -verticalScale(9),
          // 여행영상: 오른쪽 끝을 헤더 여백에 맞춤 / AI 일정: 캘린더 아이콘 중앙
          right: underPlus
            ? scale(20)
            : scale(20) +
              moderateScale(30) +
              scale(16) +
              moderateScale(11) -
              TOOLTIP_W / 2,
          alignItems: underPlus ? "flex-end" : "center",
          zIndex: 10,
        }}
      >
        {/* 꼬리 (위로 향하는 삼각형) */}
        <View
          style={{
            width: 0,
            height: 0,
            marginRight: underPlus ? moderateScale(15) - scale(6) : 0,
            // 둥근 말풍선 모서리와 맞닿는 부분이 뜨지 않게 살짝 겹치도록 아래로 더 뺀다
            marginBottom: -verticalScale(3),
            borderLeftWidth: scale(6),
            borderRightWidth: scale(6),
            borderBottomWidth: verticalScale(16),
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: TOOLTIP_COLOR,
          }}
        />
        {/* 말풍선 본체 */}
        <View
          style={{
            width: TOOLTIP_W,
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
            {tooltip}
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
        // 세 번째 탭 '예정된 여행'으로 이동 — 그 탭이 현재 여행 상세를 보여준다.
        onPress={() => router.navigate("/calendar")}
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
          <CalendarGridIcon
            color="#FFFFFF"
            width={moderateScale(22)}
            height={moderateScale(22)}
          />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 테마별 여행지 섹션 (GET /api/places/themed)                          */
/* ------------------------------------------------------------------ */

// 배너 상단 고정 문구 (title 은 서버 응답을 그대로 노출)
const THEMED_EYEBROW = "지금 당장 떠나요";

function ThemedPlacesSection() {
  // 최초 진입은 NATURE 고정. '다른 테마' 누르면 undefined 로 전환 → 서버 랜덤.
  const [theme, setTheme] = useState<Theme | undefined>("NATURE");
  const { data, isLoading, isFetching, refetch } = useThemedPlaces(theme);

  const onPressAnother = () => {
    // 이미 랜덤 모드면 refetch 로 새 랜덤 결과.
    // 고정 테마였으면 state 를 undefined 로 바꿔 queryKey 전환.
    if (theme === undefined) {
      refetch();
    } else {
      setTheme(undefined);
    }
  };

  return (
    <View>
      {/* 섹션 헤더 */}
      <View
        className="flex-row items-center justify-between"
        style={{ paddingHorizontal: scale(20) }}
      >
        <Text
          className="text-gray-900 font-bold"
          style={{ fontSize: moderateScale(20) }}
        >
          테마별 여행지
        </Text>
        <Pressable
          onPress={onPressAnother}
          disabled={isFetching}
          className="flex-row items-center"
          style={{ gap: scale(4), opacity: isFetching ? 0.5 : 1 }}
          hitSlop={8}
        >
          <ThemeSwapIcon
            width={moderateScale(20)}
            height={moderateScale(20)}
          />
          <Text
            className="font-semibold"
            style={{ fontSize: moderateScale(13), color: "#5E84F4" }}
          >
            다른 테마
          </Text>
        </Pressable>
      </View>

      {/* 본문: 히어로 배너 + 이를 덮는 라운드 시트(관광지 리스트) */}
      {/* data 우선 — NATURE 는 시드가 있어 항상 즉시 렌더되고, 백그라운드 갱신
          실패(isError)에도 기존 데이터를 유지한다. 시드 없는 랜덤 테마만
          로딩/에러 상태를 노출. */}
      <View style={{ marginTop: verticalScale(12) }}>
        {data ? (
          <ThemedPlacesContent
            title={data.title}
            imageUri={data.banner_image_url}
            places={data.places}
          />
        ) : isLoading ? (
          <ThemedPlacesPlaceholder />
        ) : (
          <View style={{ paddingHorizontal: scale(20) }}>
            <ThemedErrorRow onRetry={() => refetch()} />
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * 히어로 배너(풀블리드) + 하단을 덮는 흰색 라운드 시트에 관광지 세로 리스트.
 * 시트가 배너 하단을 살짝 덮어(음수 marginTop) 곡선이 이미지 위로 올라오는 형태.
 */
function ThemedPlacesContent({
  title,
  imageUri,
  places,
}: {
  title: string;
  imageUri: string | null;
  places: ThemePlaceCard[];
}) {
  return (
    <View>
      {/* 히어로 배너 */}
      <View style={{ height: verticalScale(200), ...CARD_ELEVATION }}>
        <ThemedRemoteImage
          uri={imageUri}
          style={{ width: "100%", height: "100%" }}
        >
          {/* 하단 어둡게 — 텍스트 가독성 */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View
            style={{
              position: "absolute",
              left: scale(20),
              right: scale(20),
              bottom: verticalScale(40),
            }}
          >
            <Text
              className="text-white font-bold"
              style={{ fontSize: moderateScale(17) }}
            >
              {THEMED_EYEBROW}
            </Text>
            <Text
              className="text-white font-bold"
              style={{ fontSize: moderateScale(17), marginTop: verticalScale(4) }}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>
        </ThemedRemoteImage>
      </View>

      {/* 배너 하단을 덮는 라운드 시트 */}
      <View
        className="bg-white"
        style={{
          marginTop: -verticalScale(24),
          borderTopLeftRadius: scale(24),
          borderTopRightRadius: scale(24),
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(22),
        }}
      >
        {places.length > 0 ? (
          places.map((p, i) => (
            <ThemedPlaceRow
              key={`${p.name}-${i}`}
              place={p}
              last={i === places.length - 1}
            />
          ))
        ) : (
          <Text
            className="text-gray-500"
            style={{ fontSize: moderateScale(13) }}
          >
            추천할 관광지가 없어요
          </Text>
        )}
      </View>
    </View>
  );
}

function ThemedPlacesPlaceholder() {
  return (
    <View
      className="items-center justify-center bg-gray-100"
      style={{
        height: verticalScale(200),
        marginHorizontal: scale(20),
        borderRadius: scale(16),
      }}
    >
      <ActivityIndicator color="#9CA3AF" />
    </View>
  );
}

function ThemedErrorRow({ onRetry }: { onRetry: () => void }) {
  return (
    <View
      className="items-center justify-center bg-gray-50"
      style={{ height: verticalScale(140), borderRadius: scale(16) }}
    >
      <Text
        className="text-gray-500"
        style={{ fontSize: moderateScale(13) }}
      >
        테마별 여행지를 불러오지 못했어요
      </Text>
      <Pressable
        onPress={onRetry}
        className="mt-3 bg-gray-800 rounded-full"
        style={{
          paddingHorizontal: scale(16),
          paddingVertical: verticalScale(6),
        }}
      >
        <Text
          className="text-white font-semibold"
          style={{ fontSize: moderateScale(12) }}
        >
          다시 시도
        </Text>
      </Pressable>
    </View>
  );
}

/** 썸네일(좌) + 이름 + 지역 태그(우) 한 줄 카드. */
function ThemedPlaceRow({
  place,
  last,
}: {
  place: ThemePlaceCard;
  last: boolean;
}) {
  return (
    <View
      className="flex-row items-center"
      style={{ marginBottom: last ? 0 : verticalScale(18) }}
    >
      <View
        className="overflow-hidden"
        style={{ width: scale(80), height: scale(80), borderRadius: scale(14) }}
      >
        <ThemedRemoteImage
          uri={place.image_url}
          style={{ width: "100%", height: "100%" }}
        />
      </View>
      <View className="flex-1" style={{ marginLeft: scale(16) }}>
        <Text
          className="text-gray-900 font-bold"
          numberOfLines={1}
          style={{ fontSize: moderateScale(18) }}
        >
          {place.name}
        </Text>
        <View
          className="self-start bg-gray-100"
          style={{
            marginTop: verticalScale(8),
            paddingHorizontal: scale(10),
            paddingVertical: verticalScale(4),
            borderRadius: scale(8),
          }}
        >
          <Text
            className="text-gray-500"
            numberOfLines={1}
            style={{ fontSize: moderateScale(12) }}
          >
            {place.region}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * 테마 섹션용 원격 이미지. uri 가 null 이거나 로드 실패 시 Main.png 로 폴백.
 * (안드로이드 cleartext 는 app.config 에서 이미 허용)
 */
function ThemedRemoteImage({
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
  if (useRemote) {
    return (
      <ImageBackground
        source={{ uri: uri! }}
        resizeMode="cover"
        style={style}
        onError={() => setFailed(true)}
      >
        {children}
      </ImageBackground>
    );
  }
  return (
    <ImageBackground source={ICONS.main} resizeMode="cover" style={style}>
      {children}
    </ImageBackground>
  );
}
