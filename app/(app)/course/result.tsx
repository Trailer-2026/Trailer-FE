import Feather from "@expo/vector-icons/Feather";
import { isAxiosError } from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { describeApiError } from "@/src/api/errors";
import BackIcon from "@/src/components/icons/BackIcon";
import PlaceMarkerIcon from "@/src/components/icons/PlaceMarkerIcon";
import RefreshIcon from "@/src/components/icons/RefreshIcon";
import { StaticTabBar } from "@/src/components/StaticTabBar";
import { Text } from "@/src/components/Text";
import { addDays } from "@/src/features/course/date";
import { formatMinutes, kstHourMinute } from "@/src/features/course/format";
import { useRecommendCourses } from "@/src/features/course/queries";
import { buildRecommendCriteria, useCourseStore } from "@/src/features/course/store";
import {
  RECOMMEND_MAX_PAGE,
  type Itinerary,
  type PlaceInfo,
  type Segment,
  type TrainInfo,
} from "@/src/features/course/types";
import { useCreateTravel } from "@/src/features/travel/queries";
import { HEADER_TOP_GAP, headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";
import { toHttps } from "@/src/utils/url";

// http:// 이미지가 안드로이드 cleartext 로 막히거나 서버가 null 로 줄 때의 대체 이미지.
const PLACEHOLDER_IMAGE = require("../../../assets/images/Main1.webp");

// 플랜 요약 아이콘 (PNG 에셋).
const ICON_TRAVEL_TIME = require("../../../assets/images/style/Train.png");
// 하차(도보) 노드용 사람 걷기 아이콘 (Figma base64 → 검증된 PNG).
const ICON_WALK = require("../../../assets/images/style/Walk.png");
// 승차/하차 제목 왼쪽 KTX 로고 (풀컬러, 원본 204×76 ≈ 2.68:1).
const ICON_KTX = require("../../../assets/images/style/ktx.png");
const ICON_SCHEDULE = require("../../../assets/images/style/Schedule.png");
const ICON_THEME = require("../../../assets/images/style/Color Palette.png");

// 플랜 카드 캐러셀 치수. (갤럭시 A24 기준 좌우 여백 + 다음 카드 살짝 보이도록)
const CARD_W = scale(215);
const CARD_GAP = scale(12);
const CARD_H = scale(215);
const SNAP = CARD_W + CARD_GAP;
// 카드가 화면 정중앙에 스냅되도록 좌우 여백을 잡는다.
const CARD_SIDE = (Dimensions.get("window").width - CARD_W) / 2;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 서버 테마 enum → 요약용 짧은 한글. (main_themes 가 한글이면 그대로 노출)
const THEME_SHORT: Record<string, string> = {
  NATURE: "산",
  OCEAN: "바다",
  HISTORY: "역사",
  CITY: "도시",
  HEALING: "힐링",
  FOOD: "맛집",
  CULTURE: "문화",
  THEME_PARK: "테마파크",
};

export default function ResultScreen() {
  // 진입 시점의 store 스냅샷으로 base criteria + 여행 날짜를 고정한다.
  const baseCriteria = useMemo(() => {
    try {
      return buildRecommendCriteria(useCourseStore.getState(), 0);
    } catch {
      return null;
    }
  }, []);
  const tripStart = useMemo(() => useCourseStore.getState().departDate, []);

  const [page, setPage] = useState(0);
  const [planIdx, setPlanIdx] = useState(0);
  const [activeDay, setActiveDay] = useState(1);
  const carouselRef = useRef<ScrollView>(null);
  // 카드 스케일을 스크롤 위치에 연속적으로 물리기 위한 애니메이션 값.
  const scrollX = useRef(new Animated.Value(0)).current;

  const criteria = useMemo(
    () => (baseCriteria ? { ...baseCriteria, page } : null),
    [baseCriteria, page],
  );

  const { data, error, isLoading, isError, refetch } = useRecommendCourses(criteria);
  const createTravel = useCreateTravel();

  // 목적지 구분 없이 모든 코스(플랜)를 한 줄로 펼친다. 각 카드 = 하나의 일정.
  const plans = useMemo<Itinerary[]>(
    () => (data?.destinations ?? []).flatMap((d) => d.itineraries),
    [data],
  );

  // 새 추천 page 를 받으면 활성 플랜을 처음으로 되돌린다.
  useEffect(() => {
    setPlanIdx(0);
  }, [page]);

  const activePlan: Itinerary | undefined = plans[planIdx];

  // 활성 플랜에 존재하는 일차(day_no) 목록 → 날짜 스트립/타임라인의 기준.
  const dayNos = useMemo(() => {
    if (!activePlan) return [] as number[];
    const set = new Set<number>();
    activePlan.segments.forEach((s) => set.add(s.day_no));
    return Array.from(set).sort((a, b) => a - b);
  }, [activePlan]);

  // 플랜이 바뀌면 선택 일차를 첫째 날로.
  useEffect(() => {
    setActiveDay(dayNos[0] ?? 1);
  }, [dayNos]);

  // 초기 추천(page 0) 이후 "다시받기"는 최대 RECOMMEND_MAX_PAGE(3)회까지만.
  const retriesLeft = Math.max(0, RECOMMEND_MAX_PAGE - page);
  const canRetry = retriesLeft > 0;

  const onCarouselEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / SNAP);
    setPlanIdx(Math.max(0, Math.min(plans.length - 1, i)));
  };

  const selectPlan = (i: number) => {
    setPlanIdx(i);
    carouselRef.current?.scrollTo({ x: i * SNAP, animated: true });
  };

  // "이 여행 담기" — 서버에 여행 저장(POST) → 성공 시 홈으로.
  // 홈의 예정 여행 카드는 useCreateTravel 이 travels/current 를 invalidate 해 자동 갱신된다.
  // 저장 성공 시 서버가 알림 로그에 이벤트를 남기므로 알림 탭에서도 이후 확인 가능.
  const onSaveTravel = () => {
    if (!activePlan || createTravel.isPending) return;
    createTravel.mutate(activePlan.plan_id, {
      onSuccess: () => {
        // 성공 알림은 서버가 알림 로그에 기록 → 알림 탭에서 확인.
        router.replace("/"); // 메인(홈)으로
      },
      onError: (err) => {
        // 400: plan_id 캐시 만료 → 다시 추천받기 유도
        if (isAxiosError(err) && err.response?.status === 400) {
          Alert.alert("추천이 만료됐어요", "다시 추천받아 주세요.", [
            { text: "취소", style: "cancel" },
            { text: "다시 추천받기", onPress: () => refetch() },
          ]);
          return;
        }
        Alert.alert("저장 실패", describeApiError(err));
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* 헤더 */}
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: scale(20),
          ...headerBarStyle(),
          gap: scale(3),
        }}
      >
        {/* 뒤로가 아니라 홈으로 — 추천 조건 화면으로 되돌아가 봐야 할 일이 없고,
            담지 않고 빠져나갈 길이 여기뿐이다. */}
        <Pressable
          onPress={() => router.replace("/")}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="홈으로"
          style={{
            width: scale(28),
            height: scale(28),
            justifyContent: "center",
          }}
        >
          <BackIcon width={moderateScale(12)} height={moderateScale(17)} />
        </Pressable>
        <Pressable onPress={() => router.replace("/")} hitSlop={8}>
          <Text
            className="text-gray-500"
            style={{ fontSize: moderateScale(13) }}
          >
            홈으로
          </Text>
        </Pressable>
        {/* 제목은 헤더 폭 기준 정중앙 — 좌측 '< 홈으로' 길이에 밀리지 않게 겹쳐 놓는다.
            top 은 헤더의 paddingTop 과 맞춰야 세로 중앙이 다른 화면과 같아진다. */}
        <View
          pointerEvents="none"
          className="items-center justify-center"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: HEADER_TOP_GAP,
            bottom: 0,
          }}
        >
          <Text
            className="text-gray-900"
            style={{ fontSize: moderateScale(17), fontWeight: 650 as never }}
          >
            일정 추천
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#5E84F4" />
        </View>
      ) : isError || !data ? (
        <ErrorView
          message={describeApiError(error)}
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <View className="flex-1">
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
          >
            {/* 타이틀 */}
            <View style={{ paddingHorizontal: scale(20) }}>
              <Text
                className="text-gray-900"
                style={{
                  fontSize: moderateScale(22),
                  marginTop: verticalScale(20),
                  fontWeight: 650 as never,
                }}
              >
                {plans.length}가지 플랜을 추천드려요
              </Text>
              <Text
                className="text-gray-400 font-semibold"
                style={{
                  fontSize: moderateScale(14),
                  marginTop: verticalScale(6),
                }}
              >
                원하는 플랜을 선택하면 일정이 추가돼요.
              </Text>
            </View>

            {plans.length === 0 ? (
              <View
                style={{ marginTop: verticalScale(60), alignItems: "center" }}
              >
                <Text
                  className="text-gray-500"
                  style={{ fontSize: moderateScale(14) }}
                >
                  추천된 일정이 없어요
                </Text>
              </View>
            ) : (
              <>
                {/* 대표 이미지 플랜 카드 캐러셀 */}
                <Animated.ScrollView
                  ref={carouselRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={SNAP}
                  decelerationRate="fast"
                  scrollEventThrottle={16}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    // NativeWind(jsxImportSource) 환경에서 네이티브 드라이버 스크롤
                    // 이벤트가 연결되지 않는 이슈가 있어 JS 스레드로 구동한다.
                    { useNativeDriver: false },
                  )}
                  onMomentumScrollEnd={onCarouselEnd}
                  style={{
                    height: CARD_H,
                    flexGrow: 0,
                    marginTop: verticalScale(18),
                  }}
                  contentContainerStyle={{
                    paddingHorizontal: CARD_SIDE,
                    gap: CARD_GAP,
                  }}
                >
                  {plans.map((it, i) => (
                    <PlanCard
                      key={`${it.plan_id}-${i}`}
                      itinerary={it}
                      index={i}
                      scrollX={scrollX}
                      onPress={() => selectPlan(i)}
                    />
                  ))}
                </Animated.ScrollView>

                {/* 페이지 도트 */}
                <Dots count={plans.length} active={planIdx} />

                {/* 추천 다시받기 */}
                <View style={{ paddingHorizontal: scale(20) }}>
                  <Pressable
                    onPress={() => canRetry && setPage((p) => p + 1)}
                    disabled={!canRetry}
                    className="w-full flex-row items-center justify-center rounded-2xl border"
                    style={{
                      height: verticalScale(32),
                      gap: scale(6),
                      borderColor: canRetry ? "#E5E7EB" : "#F3F4F6",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <RefreshIcon
                      width={moderateScale(16)}
                      height={moderateScale(16)}
                      color={canRetry ? "#9D9D9D" : "#C4C9D2"}
                    />
                    <Text
                      style={{
                        fontSize: moderateScale(14),
                        color: canRetry ? "#4B5563" : "#C4C9D2",
                        fontWeight: 650 as never,
                      }}
                    >
                      {canRetry
                        ? `추천 다시받기 (${page}/${RECOMMEND_MAX_PAGE})`
                        : "더 이상 추천이 없어요"}
                    </Text>
                  </Pressable>
                </View>

                {/* 여행 날짜 스트립 */}
                <DateStrip
                  tripStart={tripStart}
                  dayNos={dayNos}
                  activeDay={activeDay}
                  onSelect={setActiveDay}
                />

                {activePlan ? (
                  <>
                    <Divider />
                    {/* 플랜 요약 */}
                    <PlanSummary itinerary={activePlan} index={planIdx} />

                    {/* 선택 일차 동선 헤딩 — 플랜 요약 타이틀과 동일 굵기·크기 */}
                    <Text
                      className="text-gray-900"
                      style={{
                        paddingHorizontal: scale(20),
                        marginTop: verticalScale(24),
                        fontSize: moderateScale(17),
                        fontWeight: 650 as never,
                      }}
                    >
                      {activeDay}일차 동선
                    </Text>

                    {/* 선택 일차 동선 (다크) */}
                    <DayTimeline itinerary={activePlan} day={activeDay} />
                  </>
                ) : null}
              </>
            )}
          </ScrollView>

          {/* 플로팅 담기 버튼 — 배경 없이 콘텐츠 위에 떠 있어 뒤 배경이 그대로 비침 */}
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: verticalScale(12),
              paddingHorizontal: scale(20),
            }}
          >
            <Pressable
              onPress={onSaveTravel}
              disabled={!activePlan || createTravel.isPending}
              className="w-full items-center justify-center rounded-2xl"
              style={{
                height: verticalScale(50),
                backgroundColor: activePlan ? "#5E84F4" : "#D1D5DB",
              }}
            >
              <Text
                className="font-semibold"
                style={{
                  fontSize: moderateScale(16),
                  color: activePlan ? "#FFFFFF" : "#9CA3AF",
                }}
              >
                {createTravel.isPending ? "저장 중…" : "이 여행 담기"}
              </Text>
            </Pressable>
          </View>
          </View>

          {/* 하단 탭바 (탭 그룹 밖 화면이라 정적 복제본으로 노출) */}
          <StaticTabBar />
        </>
      )}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* 플랜 카드 — 대표 장소 이미지 배경 + 플랜 뱃지 + 테마 타이틀            */
/* ------------------------------------------------------------------ */
function PlanCard({
  itinerary,
  index,
  scrollX,
  onPress,
}: {
  itinerary: Itinerary;
  index: number;
  scrollX: Animated.Value;
  onPress: () => void;
}) {
  const cover = coverImage(itinerary);
  const badge = `플랜 ${String.fromCharCode(65 + index)}`;
  const title =
    itinerary.title || itinerary.route_type || itinerary.label || "추천 코스";

  // 중앙(=index*SNAP)에서 1.0, 좌우로 멀어질수록 0.85 로 부드럽게 축소.
  // 렌더마다 interpolate() 를 새로 만들면 네이티브 애니메이션 노드가 교체되면서
  // connectAnimatedNodes 크래시가 나므로 useMemo 로 고정한다.
  const cardScale = useMemo(
    () =>
      scrollX.interpolate({
        inputRange: [(index - 1) * SNAP, index * SNAP, (index + 1) * SNAP],
        outputRange: [0.85, 1, 0.85],
        extrapolate: "clamp",
      }),
    [scrollX, index],
  );

  return (
    <Animated.View
      style={{
        width: CARD_W,
        height: CARD_H,
        transform: [{ scale: cardScale }],
      }}
    >
      <Pressable
        onPress={onPress}
        className="rounded-3xl overflow-hidden"
        style={{ width: CARD_W, height: CARD_H }}
      >
        <RemoteImage uri={cover} style={{ width: CARD_W, height: CARD_H }} />

      {/* 상단 가독성용 그라데이션 */}
      <LinearGradient
        colors={["rgba(0,0,0,0.5)", "transparent"]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: CARD_H * 0.55,
        }}
      />

      {/* 뱃지 + 테마 타이틀 (좌상단) */}
      <View
        className="absolute"
        style={{
          top: verticalScale(20),
          left: scale(22),
          right: scale(22),
        }}
      >
        <View
          className="self-start items-center justify-center rounded-full"
          style={{
            width: scale(58),
            height: verticalScale(26),
            backgroundColor: "#111827",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.9)",
          }}
        >
          <Text
            className="text-white"
            style={{ fontSize: moderateScale(12), fontWeight: 650 as never, }}
          >
            {badge}
          </Text>
        </View>
        <Text
          className="text-white font-bold"
          style={{ fontSize: moderateScale(17), marginTop: verticalScale(10) }}
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>
      </Pressable>
    </Animated.View>
  );
}

function Dots({ count, active }: { count: number; active: number }) {
  return (
    <View
      className="flex-row items-center justify-center"
      style={{
        gap: scale(6),
        marginTop: verticalScale(16),
        marginBottom: verticalScale(16),
      }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const on = i === active;
        return (
          <View
            key={i}
            style={{
              width: scale(7),
              height: scale(7),
              borderRadius: 999,
              backgroundColor: on ? "#B0E6DB" : "#D9DCE1",
            }}
          />
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 여행 날짜 스트립 — 출발일 + 일정 길이만큼, 선택 일차 강조             */
/* ------------------------------------------------------------------ */
function DateStrip({
  tripStart,
  dayNos,
  activeDay,
  onSelect,
}: {
  tripStart: Date;
  dayNos: number[];
  activeDay: number;
  onSelect: (day: number) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, marginTop: verticalScale(16) }}
      contentContainerStyle={{
        paddingHorizontal: scale(20),
        gap: scale(18),
      }}
    >
      {dayNos.map((dayNo) => {
        const date = addDays(tripStart, dayNo - 1);
        const on = dayNo === activeDay;
        return (
          <Pressable
            key={dayNo}
            onPress={() => onSelect(dayNo)}
            className="items-center"
            style={{ gap: verticalScale(6) }}
          >
            <Text
              className="font-semibold"
              style={{
                fontSize: moderateScale(14),
                color: on ? "#111827" : "#9D9D9D",
              }}
            >
              {WEEKDAYS[date.getDay()]}
            </Text>
            <View
              className="items-center justify-center rounded-full"
              style={{
                width: scale(36),
                height: scale(36),
                // Android: bg 가 transparent → 색으로 바뀔 때 borderRadius 가
                // 배경에 재적용되지 않아 사각형으로 보이는 버그. overflow 로 강제 클립.
                overflow: "hidden",
                backgroundColor: on ? "#B0E6DB" : "transparent",
              }}
            >
              <Text
                className={on ? "font-bold" : "font-medium"}
                style={{
                  fontSize: moderateScale(14),
                  color: on ? "#111827" : "#9D9D9D",
                }}
              >
                {date.getDate()}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Divider() {
  return (
    <View
      style={{
        alignSelf: "center",
        width: scale(322),
        height: 1,
        backgroundColor: "#F2F2F2",
        marginTop: verticalScale(18),
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* 플랜 요약 — 이동시간 / 일정 / 메인 테마                              */
/* ------------------------------------------------------------------ */
function PlanSummary({
  itinerary,
  index,
}: {
  itinerary: Itinerary;
  index: number;
}) {
  const badge = `플랜 ${String.fromCharCode(65 + index)}`;
  const visitCount = itinerary.segments.filter((s) => s.kind === "visit").length;
  const themeText =
    itinerary.main_themes.map((t) => THEME_SHORT[t] ?? t).join(" · ") || "-";

  return (
    <View style={{ paddingHorizontal: scale(20), marginTop: verticalScale(18) }}>
      <Text
        className="text-gray-900"
        style={{
          fontSize: moderateScale(17),
          marginBottom: verticalScale(16),
          fontWeight: 650 as never,
        }}
      >
        {badge} 일정 요약
      </Text>
      <View className="flex-row">
        <SummaryItem
          icon={<SummaryIcon source={ICON_TRAVEL_TIME} />}
          label="이동시간"
          value={formatMinutes(itinerary.total_travel_minutes)}
        />
        <SummaryItem
          icon={<SummaryIcon source={ICON_SCHEDULE} />}
          label="일정"
          value={`${visitCount}개`}
        />
        <SummaryItem
          icon={<SummaryIcon source={ICON_THEME} />}
          label="메인 테마"
          value={themeText}
        />
      </View>
    </View>
  );
}

function SummaryIcon({ source }: { source: number }) {
  return (
    <Image
      source={source}
      resizeMode="contain"
      style={{ width: moderateScale(20), height: moderateScale(20) }}
    />
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 items-center" style={{ gap: verticalScale(6) }}>
      {icon}
      <Text
        className="text-gray-800"
        style={{
          fontSize: moderateScale(14),
          marginTop: verticalScale(2),
          fontWeight: 650 as never,
        }}
      >
        {label}
      </Text>
      <Text
        className="text-gray-900 text-center"
        style={{ fontSize: moderateScale(13) }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 선택 일차 타임라인 (다크 모드)                                        */
/* ------------------------------------------------------------------ */
// 레일(마커) 컬럼은 원 크기로만 잡고, 텍스트와의 간격은 RAIL_GAP 으로 벌린다.
const RAIL_W = scale(30);
const RAIL_GAP = scale(12);
const DARK_BG = "#1A1A1A";
const DARK_TEXT = "#FFFFFF";
const DARK_SUB = "#A1A1AA";
const DARK_DIM = "#6E6E73";
const DARK_LINE = "#3A3A3C";

type Row =
  | { t: "board"; train: TrainInfo }
  | { t: "alight"; train: TrainInfo }
  | { t: "place"; place: PlaceInfo }
  | { t: "lodging"; name: string; lodgingType: string; imageUrl: string | null };

function DayTimeline({ itinerary, day }: { itinerary: Itinerary; day: number }) {
  const daySegs = useMemo(
    () => itinerary.segments.filter((s) => s.day_no === day),
    [itinerary, day],
  );

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    daySegs.forEach((seg) => {
      if (seg.kind === "train" && seg.train) {
        out.push({ t: "board", train: seg.train });
        out.push({ t: "alight", train: seg.train });
      } else if (seg.kind === "visit" && seg.place) {
        out.push({ t: "place", place: seg.place });
      } else if (seg.kind === "lodging" && seg.lodging) {
        out.push({
          t: "lodging",
          name: seg.lodging.name,
          lodgingType: seg.lodging.lodging_type,
          imageUrl: seg.lodging.image_url,
        });
      }
    });
    return out;
  }, [daySegs]);

  // 일차 헤더용 시간 계산.
  const starts = daySegs.map(segStart).filter(Boolean) as string[];
  const ends = daySegs.map(segEnd).filter(Boolean) as string[];
  const dayStart = starts[0] ?? null;
  const dayEnd = ends.length ? ends[ends.length - 1] : null;
  const dayMinutes =
    dayStart && dayEnd ? minutesBetween(dayStart, dayEnd) : null;
  const trainMinutes = daySegs.reduce(
    (sum, s) => sum + (s.kind === "train" && s.train ? s.train.duration_minutes : 0),
    0,
  );

  const dayH = dayMinutes != null ? Math.floor(dayMinutes / 60) : 0;
  const dayM = dayMinutes != null ? dayMinutes % 60 : 0;

  return (
    <View
      style={{
        marginTop: verticalScale(18),
        backgroundColor: DARK_BG,
        borderTopLeftRadius: scale(24),
        borderTopRightRadius: scale(24),
        paddingHorizontal: scale(20),
        paddingTop: verticalScale(24),
        // 플로팅 "이 여행 담기" 버튼 뒤 여백까지 다크가 채우도록 넉넉히.
        paddingBottom: verticalScale(90),
      }}
    >
      {/* 일차 헤더 — 총 소요/시간대/기차 + 예매 버튼 */}
      {dayMinutes != null ? (
        <View style={{ marginBottom: verticalScale(20) }}>
          <Text style={{ color: DARK_TEXT }}>
            <Text className="font-bold" style={{ fontSize: moderateScale(26) }}>
              {dayH}
            </Text>
            <Text style={{ fontSize: moderateScale(15) }}>시간 </Text>
            <Text className="font-bold" style={{ fontSize: moderateScale(26) }}>
              {dayM}
            </Text>
            <Text style={{ fontSize: moderateScale(15) }}>분</Text>
          </Text>
          <Text
            style={{
              color: DARK_SUB,
              fontSize: moderateScale(14),
              marginTop: verticalScale(6),
            }}
          >
            {formatKoreanClock(dayStart)} - {formatKoreanClock(dayEnd)}
          </Text>
          {trainMinutes > 0 ? (
            <Text
              style={{
                color: DARK_DIM,
                fontSize: moderateScale(13),
                marginTop: verticalScale(4),
              }}
            >
              기차 {formatMinutes(trainMinutes)}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* 구분선 */}
      <View
        style={{
          height: 1,
          backgroundColor: DARK_LINE,
          marginBottom: verticalScale(20),
        }}
      />

      {/* 레일 타임라인 */}
      {rows.map((row, i) => (
        <TimelineRow key={i} row={row} isLast={i === rows.length - 1} />
      ))}
    </View>
  );
}

function TimelineRow({ row, isLast }: { row: Row; isLast: boolean }) {
  const node = railNode(row);
  // 노드에서 나가는(아래) 연결선: 기차 승차→파란 실선, 하차(도보)→장소는 점선,
  // 그 외(장소/숙소 다음)는 선 없음.
  const bottomStyle: LineStyle =
    row.t === "board" ? "blue" : row.t === "alight" ? "dotted" : "none";
  return (
    <View style={{ flexDirection: "row" }}>
      <RailNode
        icon={node.icon}
        tint={node.tint}
        isLast={isLast}
        bottomStyle={bottomStyle}
        // 장소 마커 밑에 방문 시간(시간만) 표기.
        timeLabel={row.t === "place" ? formatMarkerClock(row.place.visit_time) : ""}
      />
      <View style={{ flex: 1 }}>
        {row.t === "board" ? (
          <BoardBody train={row.train} />
        ) : row.t === "alight" ? (
          <AlightBody train={row.train} />
        ) : row.t === "place" ? (
          <PlaceBody place={row.place} />
        ) : (
          <LodgingBody name={row.name} imageUrl={row.imageUrl} />
        )}
        {/* 항목 사이 구분선 (마지막 제외). 아래쪽에 둬서 다음 노드가
            제목 옆에 자연스럽게 정렬되고, 레일 연결선을 쪼개지 않는다. */}
        {!isLast ? (
          <View
            style={{
              height: 1,
              backgroundColor: DARK_LINE,
              marginTop: verticalScale(22),
              marginBottom: verticalScale(22),
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

function railNode(row: Row): { icon: ReactNode; tint: string } {
  switch (row.t) {
    case "board":
      return {
        tint: "#5E84F4",
        icon: (
          <Image
            source={ICON_TRAVEL_TIME}
            resizeMode="contain"
            style={{
              width: moderateScale(19),
              height: moderateScale(19),
              tintColor: "#5E84F4",
            }}
          />
        ),
      };
    case "alight":
      return {
        tint: "#9CA3AF",
        icon: (
          <Image
            source={ICON_WALK}
            resizeMode="contain"
            style={{
              width: moderateScale(19),
              height: moderateScale(19),
              tintColor: "#9CA3AF",
            }}
          />
        ),
      };
    case "lodging":
      return {
        tint: "#6B7280",
        icon: (
          <Feather name="home" size={moderateScale(14)} color="#6B7280" />
        ),
      };
    default:
      return {
        tint: "#B0E6DB",
        icon: (
          <PlaceMarkerIcon
            width={moderateScale(13.5)}
            height={moderateScale(18)}
            color="#B0E6DB"
            dotFill={DARK_BG}
          />
        ),
      };
  }
}

type LineStyle = "none" | "blue" | "dotted";

function RailNode({
  icon,
  tint,
  isLast,
  bottomStyle,
  timeLabel = "",
}: {
  icon: ReactNode;
  tint: string;
  isLast: boolean;
  // 노드 아래로 나가는 연결선 스타일.
  bottomStyle: LineStyle;
  // 마커 밑에 표기할 시간(장소 방문 시간). 없으면 표시 안 함.
  timeLabel?: string;
}) {
  return (
    <View style={{ width: RAIL_W, alignItems: "center", marginRight: RAIL_GAP }}>
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: scale(30),
          height: scale(30),
          borderWidth: 1.5,
          borderColor: tint,
          backgroundColor: DARK_BG,
        }}
      >
        {icon}
      </View>
      {timeLabel ? (
        <Text
          style={{
            color: DARK_SUB,
            fontSize: moderateScale(11),
            marginTop: verticalScale(6),
          }}
        >
          {timeLabel}
        </Text>
      ) : null}
      {isLast || bottomStyle === "none" ? null : bottomStyle === "blue" ? (
        // 기차 이동 구간 — 파란 실선 (양 끝 동그라미에 맞닿도록 여백 제거)
        <View style={{ flex: 1, width: 2, backgroundColor: "#5E84F4" }} />
      ) : (
        // 하차(도보)→장소 구간 — 점 5개로 균등하게 채우는 점선
        <DottedLine />
      )}
    </View>
  );
}

// 세로 점선 — 노드 사이를 5×5 점 5개로 균등하게 채운다(양 끝 원 근처부터 고르게).
function DottedLine() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: verticalScale(4),
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: DARK_LINE,
          }}
        />
      ))}
    </View>
  );
}

function BoardBody({ train }: { train: TrainInfo }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View>
      <View className="flex-row items-center" style={{ gap: scale(6) }}>
        <Image
          source={ICON_KTX}
          resizeMode="contain"
          style={{ width: moderateScale(51), height: moderateScale(19) }}
        />
        <Text
          className="font-bold"
          style={{ fontSize: moderateScale(16), color: DARK_TEXT }}
        >
          {train.dep_station} 승차
        </Text>
      </View>
      <View
        className="flex-row items-center"
        style={{ gap: scale(6), marginTop: verticalScale(12) }}
      >
        <View
          className="rounded-md"
          style={{
            backgroundColor: "#5E84F4",
            paddingHorizontal: scale(9),
            paddingVertical: verticalScale(2),
          }}
        >
          <Text
            className="font-bold"
            style={{ fontSize: moderateScale(11), color: "#1A1A1A" }}
          >
            {train.grade}
          </Text>
        </View>
        <Text
          className="font-semibold"
          style={{ fontSize: moderateScale(13), color: "#5E84F4" }}
        >
          {train.arr_station}행
        </Text>
      </View>
      <Text
        style={{
          color: DARK_SUB,
          fontSize: moderateScale(12),
          marginTop: verticalScale(8),
        }}
      >
        {formatKoreanClock(train.dep_time)} 출발
      </Text>

      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center"
        style={{
          marginTop: verticalScale(14),
          paddingTop: verticalScale(14),
          borderTopWidth: 1,
          borderTopColor: DARK_LINE,
        }}
      >
        <Text
          style={{
            color: DARK_SUB,
            fontSize: moderateScale(12),
            marginRight: scale(18),
          }}
          className="font-medium"
        >
          {train.stop_station_count}개 역 이동
        </Text>
        <Text
          className="font-semibold"
          style={{ color: "#CACACA", fontSize: moderateScale(14) }}
        >
          {formatMinutes(train.duration_minutes)}
        </Text>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={moderateScale(15)}
          color={DARK_SUB}
        />
      </Pressable>
      {expanded && train.stop_stations.length > 0 ? (
        <View style={{ marginTop: verticalScale(10), gap: verticalScale(3) }}>
          {train.stop_stations.map((s, i) => (
            <Text
              key={`${s}-${i}`}
              style={{ color: DARK_SUB, fontSize: moderateScale(13) }}
            >
              · {s}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function AlightBody({ train }: { train: TrainInfo }) {
  return (
    <View>
      <Text
        className="font-bold"
        style={{ fontSize: moderateScale(16), color: DARK_TEXT }}
      >
        {train.arr_station} 하차
      </Text>
      <Text
        style={{
          color: DARK_SUB,
          fontSize: moderateScale(12),
          marginTop: verticalScale(4),
        }}
      >
        {formatKoreanClock(train.arr_time)} 도착
      </Text>
    </View>
  );
}

function PlaceBody({ place }: { place: PlaceInfo }) {
  const openHours = formatOpenHours(place.open_time, place.close_time);
  return (
    <View>
      <Text
        className="font-bold"
        style={{ fontSize: moderateScale(16), color: DARK_TEXT }}
      >
        {place.name}
      </Text>
      {place.region ? (
        <Text
          style={{
            color: DARK_SUB,
            fontSize: moderateScale(13),
            marginTop: verticalScale(4),
          }}
        >
          {place.region}
        </Text>
      ) : null}
      {/* 장소 주소 밑에 운영시간만. 없으면 표시 안 함. */}
      {openHours ? (
        <Text
          style={{
            color: DARK_DIM,
            fontSize: moderateScale(12),
            marginTop: verticalScale(4),
          }}
        >
          운영시간 {openHours}
        </Text>
      ) : null}
      <RemoteImage
        uri={place.image_url}
        style={{ width: "100%", height: verticalScale(150) }}
        rounded
      />
    </View>
  );
}

function LodgingBody({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) {
  return (
    <View>
      <Text
        className="font-bold"
        style={{ fontSize: moderateScale(16), color: DARK_TEXT }}
      >
        {name}
      </Text>
      <RemoteImage
        uri={imageUrl}
        style={{ width: "100%", height: verticalScale(130) }}
        rounded
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 공통                                                                */
/* ------------------------------------------------------------------ */
function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text
        className="font-semibold text-gray-900"
        style={{ fontSize: moderateScale(16) }}
      >
        추천을 불러오지 못했어요
      </Text>
      <Text
        className="text-gray-500 text-center"
        style={{ fontSize: moderateScale(13), marginTop: verticalScale(6) }}
        selectable
      >
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        className="mt-6 bg-gray-800 rounded-full"
        style={{
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
    </View>
  );
}

/**
 * 원격 이미지. uri 가 null 이거나 로드 실패 시 placeholder 로 대체.
 * (안드로이드 cleartext 는 app.config 에서 허용해두지만, 실패해도 화면이 깨지지 않도록 방어)
 */
function RemoteImage({
  uri,
  style,
  rounded,
}: {
  uri: string | null;
  style: { width: number | `${number}%` | "auto"; height: number };
  rounded?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  // 서버가 http:// 로 주는 이미지도 https 로 올려서 받는다(평문 차단·변조 방지).
  const src = toHttps(uri);
  const radius = rounded
    ? { borderRadius: scale(14), marginTop: verticalScale(10) }
    : null;
  if (!src || failed) {
    return (
      <Image
        source={PLACEHOLDER_IMAGE}
        resizeMode="cover"
        style={{ ...style, ...radius, opacity: 0.9 }}
      />
    );
  }
  return (
    <Image
      source={{ uri: src }}
      resizeMode="cover"
      style={{ ...style, ...radius }}
      onError={() => setFailed(true)}
    />
  );
}

/** 플랜 대표 이미지: cover → 첫 방문지 이미지 → null(placeholder). */
function coverImage(it: Itinerary): string | null {
  if (it.cover_image_url) return it.cover_image_url;
  const firstVisit = it.segments.find(
    (s) => s.kind === "visit" && s.place?.image_url,
  );
  return firstVisit?.place?.image_url ?? null;
}

function segStart(s: Segment): string | null {
  return s.start_time ?? s.train?.dep_time ?? s.place?.visit_time ?? null;
}

function segEnd(s: Segment): string | null {
  return s.end_time ?? s.train?.arr_time ?? null;
}

function minutesBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  if (Number.isNaN(ms)) return 0;
  return Math.max(0, Math.round(ms / 60000));
}

/** ISO8601 → KST 기준 "오전 9:00" / "오후 6:31" */
function formatKoreanClock(iso: string | null | undefined): string {
  const hm = kstHourMinute(iso);
  if (!hm) return "";
  const ampm = hm.h < 12 ? "오전" : "오후";
  const hh = hm.h % 12 === 0 ? 12 : hm.h % 12;
  return `${ampm} ${hh}:${String(hm.m).padStart(2, "0")}`;
}

/**
 * 장소 방문 시간 라벨.
 * - ISO8601 이면 출발/도착과 동일한 "오전/오후" 형식으로 통일.
 * - 서버가 "HH:mm" 로 줄 때도 깨지지 않도록 방어.
 */
function formatVisitClock(v: string | null | undefined): string {
  const korean = formatKoreanClock(v);
  if (korean) return korean;
  if (v && /^\d{1,2}:\d{2}/.test(v)) return v.slice(0, 5);
  return "";
}

/** 마커 밑 방문 시간 — 좁은 레일에 맞춰 KST 24시간 "HH:mm". */
function formatMarkerClock(v: string | null | undefined): string {
  if (!v) return "";
  const hm = kstHourMinute(v);
  if (hm) {
    return `${String(hm.h).padStart(2, "0")}:${String(hm.m).padStart(2, "0")}`;
  }
  const m = /^(\d{1,2}):(\d{2})/.exec(v);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
}

/** 운영시간 "open - close". 한쪽만 있으면 있는 쪽만, 둘 다 없으면 "". */
function formatOpenHours(
  open: string | null | undefined,
  close: string | null | undefined,
): string {
  const o = formatVisitClock(open);
  const c = formatVisitClock(close);
  if (o && c) return `${o} - ${c}`;
  return o || c || "";
}
