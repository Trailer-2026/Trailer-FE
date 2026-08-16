import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AddCircleIcon from "@/src/components/icons/AddCircleIcon";
import CalendarGridIcon from "@/src/components/icons/CalendarGridIcon";
import PlaceMarkerIcon from "@/src/components/icons/PlaceMarkerIcon";
import ThemeSwapIcon from "@/src/components/icons/ThemeSwapIcon";
import { Text } from "@/src/components/Text";
import type { Theme } from "@/src/features/course/types";
import { placeKeys } from "@/src/features/place/keys";
import { useThemedPlaces } from "@/src/features/place/queries";
import type { ThemePlaceCard } from "@/src/features/place/types";
import { reelsKeys } from "@/src/features/reels/keys";
import {
  HOME_PREVIEW_LIMIT,
  useReelsPreview,
} from "@/src/features/reels/queries";
import type { Reels } from "@/src/features/reels/types";
import {
  formatTravelPeriod,
  travelStatusLabel,
} from "@/src/features/travel/format";
import { travelKeys } from "@/src/features/travel/keys";
import { useCurrentTravel } from "@/src/features/travel/queries";
import type { HomeTravelCard } from "@/src/features/travel/types";
import { NAEILRO_PASS_URL, openExternalUrl } from "@/src/utils/links";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";
import { toHttps } from "@/src/utils/url";

// Figma 내보내기 아이콘 에셋 (Metro 는 대소문자 구분 — 실제 파일명 케이스와 정확히 일치시킬 것)
const ICONS = {
  ticket: require("../../../assets/images/Ticket.png"),
  main: require("../../../assets/images/Main1.png"),
};

/** 메인 배너 슬라이드 3장 — 좌우로 넘겨 본다. */
const HERO_SLIDES = [
  {
    image: require("../../../assets/images/Main1.png"),
    tag: "AI 일정추천",
    lines: ["취향만 고르면", "일정은 AI가 짜드려요"],
  },
  {
    image: require("../../../assets/images/Main2.png"),
    tag: "여행 영상 제작",
    lines: ["천천히 가는 만큼,", "더 많이 담아갑니다"],
  },
  {
    image: require("../../../assets/images/Main3.png"),
    tag: "내일로패스",
    lines: ["우리의 청춘을 연결하는", "한 장의 패스"],
  },
] as const;

/** 끝에서 한 번 더 넘기면 1번으로 돌아가도록 첫 장을 뒤에 복제해 둔다(순환). */
const HERO_LOOP = [...HERO_SLIDES, HERO_SLIDES[0]];

const HERO_HEIGHT = verticalScale(198);

const TOOLTIP_COLOR = "#5E84F4"; // 상단 + 아래 말풍선
const TOOLTIP_W = scale(100);
// 말풍선 문구 — 홈에 들어올 때마다 번갈아 노출.
const TOOLTIP_MESSAGES = ["AI 일정 만들기", "여행영상 만들기"] as const;

// 안드로이드 카드 입체감용 공통 스타일 (NativeWind shadow-* 가 흐릿하게 보이는 문제 보완)
const CARD_ELEVATION = {
  elevation: 4,
  shadowColor: "#000",
} as const;

export default function HomeScreen() {
  const { data: currentTravel } = useCurrentTravel();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  /**
   * 당겨서 새로고침 — 추천 릴스·테마별 여행지·현재 여행을 서버에서 다시 받는다.
   * 테마별 여행지는 지금 보고 있는 테마(고정/랜덤) 키만 갱신하도록 type:"active" 로 좁힌다.
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: reelsKeys.preview(HOME_PREVIEW_LIMIT),
          exact: true,
        }),
        queryClient.refetchQueries({
          queryKey: [...placeKeys.all, "themed"],
          type: "active",
        }),
        queryClient.refetchQueries({ queryKey: travelKeys.current() }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5E84F4"]}
            tintColor="#5E84F4"
          />
        }
        contentContainerStyle={{
          // 현재 여행 카드는 absolute 로 떠 있어 콘텐츠를 밀어내지 못한다.
          // 카드가 있을 때만 그 높이(77)+아래 여백(27)만큼 더 비워 마지막 항목이 가리지 않게 한다.
          paddingBottom: currentTravel
            ? verticalScale(32 + 77 + 27)
            : verticalScale(32),
        }}
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
        // 앱 전체 상단바와 같은 높이로 맞추기 위한 여백.
        marginTop: verticalScale(6),
        height: verticalScale(44),
      }}
    >
      <Text
        className="text-gray-900"
        style={{ fontSize: moderateScale(20), fontWeight: 650 as never }}
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
  const { width } = useWindowDimensions();
  const [slide, setSlide] = useState(0);
  const heroRef = useRef<ScrollView>(null);
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
      {/* 배경 이미지 배너 360 x 198 — 좌우로 3장 넘김 */}
      <View
        className="overflow-hidden"
        style={{ height: HERO_HEIGHT, ...CARD_ELEVATION }}
      >
        <ScrollView
          ref={heroRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          // 화면 폭을 슬라이드 한 장으로 삼는다(배너가 좌우 여백 없이 꽉 참).
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            // 마지막 뒤의 복제 슬라이드(= 1번 사진)에 닿았으면 애니메이션 없이 실제 1번으로
            // 되돌린다 — 사용자에겐 3장이 끊김 없이 순환하는 것으로 보인다.
            if (i === HERO_SLIDES.length) {
              heroRef.current?.scrollTo({ x: 0, animated: false });
              setSlide(0);
            } else {
              setSlide(i);
            }
          }}
        >
          {HERO_LOOP.map((s, si) => (
            <ImageBackground
              key={`${s.tag}-${si}`}
              source={s.image}
              resizeMode="cover"
              style={{ width, height: HERO_HEIGHT }}
            >
              {/* 태그 — Bold 12, X19 / Y122 */}
              <Text
                className="text-teal-400"
                style={{
                  position: "absolute",
                  left: scale(19),
                  top: verticalScale(40),
                  fontSize: moderateScale(13),
                  fontWeight: 650 as never,
                }}
              >
                {s.tag}
              </Text>

              {/* 본문 2줄 — 16, X19 / Y147.5, 165.5 */}
              {s.lines.map((line, i) => (
                <Text
                  key={line}
                  className="text-white"
                  style={{
                    position: "absolute",
                    left: scale(19),
                    top: verticalScale(65.5 + i * 19),
                    fontSize: moderateScale(17),
                    fontWeight: 650 as never,
                  }}
                >
                  {line}
                </Text>
              ))}
            </ImageBackground>
          ))}
        </ScrollView>

        {/* 우하단 인디케이터 — 넘길 때마다 숫자만 바뀐다 */}
        <View
          className="absolute items-center bg-black/40 rounded-full"
          style={{
            bottom: verticalScale(14),
            right: scale(14),
            paddingHorizontal: scale(10),
            paddingVertical: verticalScale(4),
          }}
        >
          <Text
            className="text-white font-semibold"
            style={{ fontSize: moderateScale(12) }}
          >
            {slide + 1}/{HERO_SLIDES.length}
          </Text>
        </View>
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

      {/* 내일로 패스 예약하기 — 360 x 29, #F2F2F2. 탭하면 코레일 안내 페이지(웹) */}
      <Pressable
        onPress={() => openExternalUrl(NAEILRO_PASS_URL)}
        className="flex-row items-center justify-center active:opacity-70"
        style={{
          height: verticalScale(29),
          backgroundColor: "#F2F2F2",
          gap: scale(6),
        }}
        accessibilityRole="link"
        accessibilityLabel="내일로 패스 예약하기"
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
        style={{
          color: "#668DFF",
          fontSize: moderateScale(14),
          fontWeight: 650 as never,
          marginTop: verticalScale(10),
        }}
      >
        어디로 떠나볼까요?
      </Text>
      <Text
        className="text-gray-900"
        style={{
          fontSize: moderateScale(20),
          marginTop: verticalScale(4),
          fontWeight: 650 as never,
        }}
      >
        지금 사람들이 떠나는 여행 보기
      </Text>
    </View>
  );
}

/** 추천 릴스 3개(GET /api/videos/reels/recommend?limit=3). 탭하면 그 릴스부터 피드에서 본다. */
function FeedCarousel() {
  const { data: reels = [], isLoading } = useReelsPreview(HOME_PREVIEW_LIMIT);

  if (isLoading) {
    return (
      <View
        className="items-center justify-center"
        style={{ height: verticalScale(250) }}
      >
        <ActivityIndicator color="#9CA3AF" />
      </View>
    );
  }
  if (reels.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: scale(20),
        gap: scale(12),
      }}
    >
      {reels.map((r) => (
        <FeedCard key={r.reels_idx} reels={r} />
      ))}
    </ScrollView>
  );
}

function FeedCard({ reels }: { reels: Reels }) {
  const location = reels.location;
  return (
    <Pressable
      // 피드가 이 릴스를 맨 앞에 세운다 — 데이터는 이미 받아 둔 preview 캐시에서 꺼내
      // 쓰므로 추가 요청이 없다.
      onPress={() =>
        router.navigate({
          pathname: "/feed",
          params: { reelsIdx: String(reels.reels_idx) },
        })
      }
      className="overflow-hidden active:opacity-80"
      style={{
        width: scale(168),
        height: verticalScale(250),
        borderRadius: scale(16),
        ...CARD_ELEVATION,
      }}
      accessibilityRole="button"
      accessibilityLabel={reels.caption || "추천 여행영상"}
    >
      {/* 썸네일. 렌더 전 옛 릴스는 thumbnail_url 이 null → Main1 로 폴백 */}
      <ThemedRemoteImage
        uri={reels.thumbnail_url}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        {/* 지역 — 좌상단 핀 배지 (내 영상 그리드와 같은 스타일) */}
        {location ? (
          <View
            className="absolute flex-row items-center"
            pointerEvents="none"
            style={{
              top: scale(8),
              left: scale(8),
              backgroundColor: "rgba(0,0,0,0.55)",
              borderRadius: scale(11),
              paddingHorizontal: scale(7),
              paddingVertical: verticalScale(3),
              gap: scale(3),
            }}
          >
            <PlaceMarkerIcon
              width={moderateScale(8)}
              height={moderateScale(10)}
              color="#FFFFFF"
              dotFill="rgba(0,0,0,0.55)"
            />
            <Text
              className="font-semibold text-white"
              numberOfLines={1}
              style={{ fontSize: moderateScale(10) }}
            >
              {location}
            </Text>
          </View>
        ) : null}
        {/* 하단 캡션 — 제목이 없는 릴스는 띠까지 통째로 빼서 빈 칸이 안 보이게 한다.
            사진 위에 얹히므로 단색 대신 아래로 짙어지는 그라데이션을 쓴다. */}
        {reels.caption ? (
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.75)"]}
            style={{
              paddingHorizontal: scale(11),
              paddingTop: verticalScale(22),
              paddingBottom: verticalScale(11),
            }}
          >
            <Text
              className="text-white font-semibold"
              numberOfLines={2}
              style={{
                fontSize: moderateScale(12),
                lineHeight: moderateScale(16),
              }}
            >
              {reels.caption}
            </Text>
          </LinearGradient>
        ) : null}
      </ThemedRemoteImage>
    </Pressable>
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
          className="text-gray-900"
          style={{ fontSize: moderateScale(20), fontWeight: 650 as never }}
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
              className="text-white"
              style={{
                fontSize: moderateScale(17),
                fontWeight: 650 as never,
              }}
            >
              {THEMED_EYEBROW}
            </Text>
            <Text
              className="text-white"
              style={{
                fontSize: moderateScale(17),
                marginTop: verticalScale(4),
                fontWeight: 650 as never,
              }}
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
  // 프리시드(seed.ts)에는 content_id 가 없어 상세로 갈 수 없다 → 그때만 눌리지 않게.
  const contentId = place.content_id;
  return (
    <Pressable
      onPress={() =>
        contentId &&
        router.push({
          pathname: "/place/[contentId]",
          params: { contentId },
        })
      }
      disabled={!contentId}
      className="flex-row items-center active:opacity-70"
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
    </Pressable>
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
  // 서버가 http:// 로 주는 이미지도 https 로 올려서 받는다(평문 차단·변조 방지).
  const src = toHttps(uri);
  const useRemote = !!src && !failed;
  if (useRemote) {
    return (
      <ImageBackground
        source={{ uri: src! }}
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
