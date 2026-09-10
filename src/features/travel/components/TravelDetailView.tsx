import Feather from "@expo/vector-icons/Feather";
import { isAxiosError } from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import PlayIcon from "@/src/components/icons/PlayIcon";
import TicketIcon from "@/src/components/icons/TicketIcon";
import { Text } from "@/src/components/Text";
import LiveScenerySection from "@/src/features/scenic/components/LiveScenerySection";
import LocationPermissionPrompt from "@/src/features/scenic/components/LocationPermissionPrompt";
import {
  findCurrentScheduleItem,
  findNearestScheduleItem,
} from "@/src/features/scenic/segments";
import { useScenicStore } from "@/src/features/scenic/store";
import { HEADER_HEIGHT, HEADER_TOP_GAP } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { formatLongDate } from "../format";
import { useTravelDetail } from "../queries";
import type { TravelDetail } from "../types";
import ScheduleTimeline from "./schedule/ScheduleTimeline";
import TicketWalletModal from "./ticket/TicketWalletModal";

const ACCENT = "#5E84F4";

const PLACEHOLDER = require("../../../../assets/images/Main1.webp");

/** 자동 스크롤이 대상 위에 남겨 두는 여백 — 앞 항목이 살짝 보여야 맥락이 읽힌다. */
const FOCUS_TOP_GAP = verticalScale(90);

/**
 * 화면에 들어오면 진행 중인 일정으로 한 번 자동 스크롤한다.
 *
 * 여행 중에 앱을 열면 일정표 맨 위(Day 1 아침)가 뜨는데 정작 보고 싶은 건 "지금
 * 어디"다. 첫 렌더에서 한 번만 내려주고 그 뒤로는 건드리지 않는다 — 새로고침이나
 * 사진 추가로 화면이 다시 그려질 때마다 튀면 오히려 방해된다.
 *
 * 대상 우선순위: 탑승 중인 열차 구간 → 진행 중인 일정 → 시각이 가장 가까운 일정.
 * 다녀온 여행(COMPLETED)은 '지금'이 없으므로 대상이 없다.
 */
function useFocusScroll(detail: TravelDetail | undefined) {
  const scrollRef = useRef<ScrollView>(null);
  /** 이미 한 번 내렸는지. */
  const done = useRef(false);
  /**
   * 대상 행의 y 는 세 단계를 더해야 나온다 — onLayout 이 주는 값은 **부모 기준**이라서다.
   *   타임라인 컨테이너(콘텐츠 기준) + DaySection(컨테이너 기준) + 행(DaySection 기준)
   * measureLayout 으로 한 번에 재는 방법도 있지만, 플랫폼이 확실히 주는 값만 쓴다.
   */
  const parts = useRef<{ list?: number; day?: number; row?: number }>({});

  const session = useScenicStore((s) => s.session);

  const scheduleIdx = useMemo(() => {
    if (!detail || detail.status === "COMPLETED") return null;
    if (session?.travelIdx === detail.travel_idx) return session.scheduleIdx;
    const now = new Date();
    return (
      findCurrentScheduleItem(detail, now)?.schedule_idx ??
      findNearestScheduleItem(detail, now)?.schedule_idx ??
      null
    );
  }, [detail, session]);

  const onPart = useCallback(
    (key: "list" | "day" | "row") => (e: LayoutChangeEvent) => {
      parts.current[key] = e.nativeEvent.layout.y;
      const { list, day, row } = parts.current;
      if (done.current || list == null || day == null || row == null) return;
      done.current = true;
      const y = Math.max(0, list + day + row - FOCUS_TOP_GAP);
      // onLayout 안에서 곧바로 부르면 ScrollView 가 아직 콘텐츠 높이를 모르는 상태라
      // 스크롤이 0 으로 잘린다. 레이아웃 커밋이 끝난 다음 프레임에 옮긴다.
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ y, animated: true }),
      );
    },
    [],
  );

  // 세 핸들러는 memo 된 DaySection/TimelineRow 에 props 로 내려가므로 한 번만 만든다
  // (렌더마다 새로 만들면 memo 가 매번 깨진다).
  const handlers = useMemo(
    () => ({
      onListLayout: onPart("list"),
      onDayLayout: onPart("day"),
      onRowLayout: onPart("row"),
    }),
    [onPart],
  );

  return { scrollRef, scheduleIdx, ...handlers };
}

/**
 * 여행 1건의 일정표 상세(히어로 + 일자별 타임라인).
 * 일정 탭 '예정된 여행'(인라인)과 다녀온 여행 상세 화면(푸시)이 공통으로 사용한다.
 *
 * - coverImageUrl: 히어로 배경(TravelDetail 응답엔 커버가 없어 호출부가 넘긴다).
 *   없으면 일정 항목 이미지 → placeholder 순으로 대체.
 * - onBack: 주면 히어로 위에 뒤로 버튼을 얹는다(푸시 화면용). 인라인 탭에선 생략.
 *
 * 일정 추가/편집/삭제/사진 모달과 그 상태는 ScheduleTimeline 이 갖는다 — 여기 두면
 * 시트를 여닫을 때마다 히어로·실시간 풍경까지 화면 전체가 다시 그려진다.
 */
export default function TravelDetailView({
  travelIdx,
  coverImageUrl,
  onBack,
}: {
  travelIdx: number;
  coverImageUrl?: string | null;
  onBack?: () => void;
}) {
  const { data, isLoading, error, refetch } = useTravelDetail(travelIdx);
  const insets = useSafeAreaInsets();
  const focus = useFocusScroll(data);

  // 히어로의 'KTX 티켓 정보 추가하기' → 승차권 화면(저장된 게 있으면 목록, 없으면 폼).
  const [ticketOpen, setTicketOpen] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  if (error || !data) {
    const notFound = isAxiosError(error) && error.response?.status === 404;
    return (
      <View
        className="flex-1 items-center justify-center bg-white"
        style={{ paddingHorizontal: scale(24), gap: verticalScale(12) }}
      >
        <Text
          className="font-semibold text-gray-900"
          style={{ fontSize: moderateScale(16) }}
        >
          {notFound ? "여행을 찾을 수 없어요" : "일정을 불러오지 못했어요"}
        </Text>
        <Pressable
          onPress={() => refetch()}
          className="bg-gray-800 rounded-full active:opacity-80"
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

  const cover = coverImageUrl ?? firstItemImage(data);
  // 다녀온 여행은 기록 열람용 — 일정 추가/티켓 등록·실시간 풍경은 의미가 없어 감춘다.
  const completed = data.status === "COMPLETED";

  return (
    <>
      <ScrollView
        ref={focus.scrollRef}
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: verticalScale(32) + insets.bottom }}
      >
        <Hero
          travel={data}
          coverUri={cover}
          onBack={onBack}
          // 다녀온 여행에서는 같은 자리가 '내 여행 영상 만들기' — 옵션 화면으로 보낸다.
          onAction={
            completed
              ? () =>
                  router.push({
                    pathname: "/travel/video",
                    params: { travelIdx, travelTitle: data.title },
                  })
              : () => setTicketOpen(true)
          }
          actionKind={completed ? "video" : "ticket"}
        />

        {/* 실시간 창밖 풍경 — 탑승 상태 표시. 열차 항목이 없으면 안 뜬다. */}
        {completed ? null : <LiveScenerySection detail={data} />}

        {/* 열차 출발 시각에 시스템 창이 불쑥 뜨지 않도록 여기서 미리 권한을 받아둔다.
            이미 허용됐거나 앱 실행 중 한 번 물어봤으면 아무것도 렌더하지 않는다. */}
        {completed ? null : <LocationPermissionPrompt />}

        <View
          style={{ paddingHorizontal: scale(20), marginTop: verticalScale(4) }}
          onLayout={focus.onListLayout}
        >
          <ScheduleTimeline
            travelIdx={travelIdx}
            days={data.days}
            readOnly={completed}
            focusScheduleIdx={focus.scheduleIdx}
            onFocusDayLayout={focus.onDayLayout}
            onFocusRowLayout={focus.onRowLayout}
          />
        </View>
      </ScrollView>

      {ticketOpen ? (
        <TicketWalletModal
          travelIdx={travelIdx}
          onClose={() => setTicketOpen(false)}
        />
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 히어로 — 커버 이미지 안에 제목/기간 + 티켓 추가 카드 (+ 뒤로)          */
/* ------------------------------------------------------------------ */
/** 히어로 하단 카드의 성격 — 예정: 티켓 등록 / 다녀온: 여행 영상 만들기. */
type HeroActionKind = "ticket" | "video";

function Hero({
  travel,
  coverUri,
  onBack,
  onAction,
  actionKind,
}: {
  travel: TravelDetail;
  coverUri: string | null;
  onBack?: () => void;
  /** 없으면 카드가 '준비 중'으로 비활성 표시된다. */
  onAction?: () => void;
  actionKind: HeroActionKind;
}) {
  const [failed, setFailed] = useState(false);
  const source = coverUri && !failed ? { uri: coverUri } : PLACEHOLDER;

  return (
    <View style={{ height: verticalScale(190) }}>
      <ImageBackground
        source={source}
        resizeMode="cover"
        style={{ flex: 1 }}
        onError={() => setFailed(true)}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.35)", "transparent", "rgba(0,0,0,0.35)"]}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={{
              position: "absolute",
              left: scale(20),
              // 히어로 위에 떠 있지만 다른 화면 상단바와 같은 높이에 오도록 맞춘다.
              top: HEADER_TOP_GAP,
              height: HEADER_HEIGHT,
              width: scale(28),
              justifyContent: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel="뒤로"
          >
            <BackIcon
              color="#FFFFFF"
              width={moderateScale(12)}
              height={moderateScale(17)}
            />
          </Pressable>
        ) : null}

        {/* 제목·기간·티켓 카드 모두 커버 이미지 안쪽 하단에 얹는다. */}
        <View
          style={{
            position: "absolute",
            left: scale(20),
            right: scale(20),
            bottom: verticalScale(14),
          }}
        >
          <Text
            className="text-white font-bold"
            style={{ fontSize: moderateScale(20) }}
            numberOfLines={2}
          >
            {travel.title}
          </Text>
          <Text
            className="text-white"
            style={{
              fontSize: moderateScale(13),
              marginTop: verticalScale(4),
              opacity: 0.95,
            }}
          >
            {formatLongDate(travel.start_date)} ~ {formatLongDate(travel.end_date)}
          </Text>
          <HeroActionCard kind={actionKind} onPress={onAction} />
        </View>
      </ImageBackground>
    </View>
  );
}

/**
 * 커버 이미지 안, 제목/기간 바로 아래 놓이는 액션 카드.
 * 예정된 여행이면 티켓 등록, 다녀온 여행이면 여행 영상 만들기로 문구·아이콘이 바뀐다.
 * onPress 가 없으면 메뉴 시트와 같은 방식으로 '준비 중' 비활성 표시.
 */
function HeroActionCard({
  kind,
  onPress,
}: {
  kind: HeroActionKind;
  onPress?: () => void;
}) {
  const video = kind === "video";
  const label = video ? "내 여행 영상 만들기" : "KTX 티켓 정보 추가하기";
  const disabled = !onPress;
  const tint = disabled ? "#C4C4C4" : ACCENT;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center bg-white active:opacity-80"
      style={{
        marginTop: verticalScale(18),
        width: scale(320),
        height: verticalScale(48),
        // 거의 사각형 — 모서리만 살짝. 그림자 대신 바깥 회색 테두리로 경계를 준다.
        borderRadius: scale(6),
        borderWidth: 1,
        borderColor: "#D9DCE1",
        paddingHorizontal: scale(16),
        gap: scale(10),
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {video ? (
        <PlayIcon
          color={tint}
          width={moderateScale(22)}
          height={moderateScale(22)}
        />
      ) : (
        <TicketIcon width={moderateScale(26)} height={moderateScale(26)} />
      )}
      <Text
        className="flex-1 font-bold"
        style={{ fontSize: moderateScale(14), color: disabled ? "#9CA3AF" : "#1F2937" }}
      >
        {label}
        {disabled ? (
          <Text
            className="font-medium"
            style={{ fontSize: moderateScale(12), color: "#C4C4C4" }}
          >
            {"  준비 중"}
          </Text>
        ) : null}
      </Text>
      {disabled ? null : (
        <Feather
          name={video ? "chevron-right" : "plus"}
          size={moderateScale(20)}
          color={ACCENT}
        />
      )}
    </Pressable>
  );
}

/** 커버 대체용 — 첫 일정 항목 이미지. */
function firstItemImage(detail: TravelDetail): string | null {
  for (const day of detail.days) {
    for (const item of day.items) {
      if (item.image_url) return item.image_url;
    }
  }
  return null;
}
