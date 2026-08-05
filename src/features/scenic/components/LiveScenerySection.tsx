import Feather from "@expo/vector-icons/Feather";
import { useMemo } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";

import { Text } from "@/src/components/Text";
import type { TravelDetail } from "@/src/features/travel/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import {
  formatBasedAt,
  formatClockLabel,
  formatDistance,
  sideLabel,
} from "../format";
import { ensureForegroundLocationPermission } from "../location";
import { useMinuteTick, useScenicPolling } from "../queries";
import {
  collectTrainSegments,
  findBoardingSuggestion,
  type TrainSegment,
} from "../segments";
import { useIsRiding, useScenicStore } from "../store";
import type { ScenicSpotItem } from "../types";

const ACCENT = "#5E84F4";
const MINT = "#34C6A8";
const CARD_BG = "#F4F4F6";
const BORDER = "#E5E7EB";

/**
 * 예정된 여행 상세의 "실시간 창밖 풍경" 섹션.
 *
 * - 탑승 중(이 여행의 세션이 있음) → 실시간 패널(구간·기준시각·관광지 top3)
 * - 아니면 → 열차 구간별 '탑승 시작' + 출발 시각 ±30분 제안 배너
 * - 열차 구간이 아예 없으면 아무것도 렌더하지 않는다.
 */
export default function LiveScenerySection({
  detail,
}: {
  detail: TravelDetail;
}) {
  const riding = useIsRiding(detail.travel_idx);
  const segments = useMemo(() => collectTrainSegments(detail), [detail]);

  if (riding) return <RidingPanel />;
  if (segments.length === 0) return null;
  return <IdlePanel travelIdx={detail.travel_idx} segments={segments} />;
}

/* ------------------------------------------------------------------ */
/* 탑승 전 — 제안 배너 + 구간별 탑승 시작                                */
/* ------------------------------------------------------------------ */
function IdlePanel({
  travelIdx,
  segments,
}: {
  travelIdx: number;
  segments: TrainSegment[];
}) {
  const now = useMinuteTick();
  const startRiding = useScenicStore((s) => s.startRiding);
  const suggestion = useMemo(
    () => findBoardingSuggestion(segments, now),
    [segments, now],
  );

  // TODO(local-notification): 출발 10분 전 로컬 알림 예약.
  //   expo-notifications 가 아직 미설치라 앱 내 배너로만 안내한다.
  //   추가하려면 새 네이티브 의존성 → prebuild --clean + 재빌드가 필요하다.

  const start = async (seg: TrainSegment) => {
    const granted = await ensureForegroundLocationPermission();
    if (!granted) {
      Alert.alert(
        "위치 권한이 필요해요",
        "창밖 풍경을 알려드리려면 위치 권한을 허용해 주세요. 설정 > 앱 > 권한에서 바꿀 수 있어요.",
      );
      return;
    }
    startRiding({
      travelIdx,
      scheduleIdx: seg.scheduleIdx,
      fromStation: seg.fromStation,
      toStation: seg.toStation,
      label: seg.label,
    });
  };

  return (
    <Section>
      {suggestion ? (
        <Pressable
          onPress={() => start(suggestion)}
          className="flex-row items-center active:opacity-80"
          style={{
            backgroundColor: "#EEF2FF",
            borderRadius: scale(10),
            borderWidth: 1,
            borderColor: "#C7D7FF",
            paddingHorizontal: scale(14),
            paddingVertical: verticalScale(12),
            gap: scale(10),
            marginBottom: verticalScale(10),
          }}
        >
          <Feather name="bell" size={moderateScale(16)} color={ACCENT} />
          <Text
            className="flex-1 text-gray-800"
            style={{ fontSize: moderateScale(13) }}
          >
            지금 {suggestion.label} 타셨나요?
          </Text>
          <Text
            className="font-bold"
            style={{ fontSize: moderateScale(13), color: ACCENT }}
          >
            탑승 시작
          </Text>
        </Pressable>
      ) : (
        <Text
          className="text-gray-400"
          style={{
            fontSize: moderateScale(12),
            marginBottom: verticalScale(10),
            lineHeight: moderateScale(18),
          }}
        >
          열차에 타면 탑승 시작을 눌러주세요. 창밖으로 보이는 관광지를 알려드려요.
        </Text>
      )}

      {segments.map((seg) => (
        <View
          key={seg.scheduleIdx}
          className="flex-row items-center"
          style={{
            backgroundColor: CARD_BG,
            borderRadius: scale(10),
            paddingHorizontal: scale(14),
            paddingVertical: verticalScale(12),
            marginTop: verticalScale(8),
            gap: scale(10),
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              className="font-bold text-gray-900"
              style={{ fontSize: moderateScale(14) }}
              numberOfLines={1}
            >
              {seg.fromStation} → {seg.toStation}
            </Text>
            <Text
              className="text-gray-500"
              style={{ fontSize: moderateScale(12), marginTop: verticalScale(2) }}
            >
              {seg.label}
              {seg.departAt ? ` · ${formatClockLabel(seg.departAt)}` : ""}
            </Text>
          </View>
          <Pressable
            onPress={() => start(seg)}
            className="active:opacity-70"
            style={{
              paddingHorizontal: scale(14),
              paddingVertical: verticalScale(8),
              borderRadius: 999,
              backgroundColor: ACCENT,
            }}
            accessibilityRole="button"
            accessibilityLabel={`${seg.fromStation} ${seg.toStation} 탑승 시작`}
          >
            <Text
              className="text-white font-semibold"
              style={{ fontSize: moderateScale(12) }}
            >
              탑승 시작
            </Text>
          </Pressable>
        </View>
      ))}
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 탑승 중 — 실시간 풍경                                                 */
/* ------------------------------------------------------------------ */
function RidingPanel() {
  const session = useScenicStore((s) => s.session);
  const result = useScenicStore((s) => s.lastResponse);
  const hasNewSpots = useScenicStore((s) => s.hasNewSpots);
  const stopRiding = useScenicStore((s) => s.stopRiding);
  const { loading, error, refresh } = useScenicPolling();

  if (!session) return null;

  const confirmStop = () =>
    Alert.alert("탑승을 종료할까요?", "실시간 풍경 알림이 멈춰요.", [
      { text: "취소", style: "cancel" },
      { text: "종료", style: "destructive", onPress: stopRiding },
    ]);

  return (
    <Section>
      {/* 현재 구간 + 기준 시각 */}
      <View className="flex-row items-center" style={{ gap: scale(8) }}>
        <View style={{ flex: 1 }}>
          <Text
            className="font-bold text-gray-900"
            style={{ fontSize: moderateScale(15) }}
            numberOfLines={1}
          >
            {session.fromStation} → {session.toStation}
          </Text>
          <Text
            className="text-gray-500"
            style={{ fontSize: moderateScale(12), marginTop: verticalScale(2) }}
          >
            {result?.based_at
              ? `${formatBasedAt(result.based_at)} 기준`
              : "위치를 확인하는 중이에요"}
          </Text>
        </View>

        <Pressable
          onPress={refresh}
          disabled={loading}
          hitSlop={10}
          className="active:opacity-60"
          style={{ padding: scale(6) }}
          accessibilityRole="button"
          accessibilityLabel="새로고침"
        >
          {loading ? (
            <ActivityIndicator size="small" color={ACCENT} />
          ) : (
            <Feather name="refresh-cw" size={moderateScale(16)} color={ACCENT} />
          )}
        </Pressable>

        <Pressable
          onPress={confirmStop}
          className="active:opacity-70"
          style={{
            paddingHorizontal: scale(12),
            paddingVertical: verticalScale(7),
            borderRadius: 999,
            borderWidth: 1,
            borderColor: BORDER,
          }}
          accessibilityRole="button"
          accessibilityLabel="탑승 종료"
        >
          <Text
            className="font-semibold text-gray-600"
            style={{ fontSize: moderateScale(12) }}
          >
            탑승 종료
          </Text>
        </Pressable>
      </View>

      {error ? (
        <Text
          style={{
            fontSize: moderateScale(12),
            color: "#EF4444",
            marginTop: verticalScale(10),
          }}
        >
          {error}
        </Text>
      ) : null}

      {/* 관광지 top3 */}
      {result && result.items.length > 0 ? (
        <View style={{ marginTop: verticalScale(12), gap: verticalScale(8) }}>
          {result.items.map((item) => (
            <SpotCard
              key={`${item.name}-${item.distance_m}`}
              item={item}
              // 같은 곳만 반복될 땐 강조하지 않는다(매 폴링마다 NEW 가 뜨지 않게).
              highlight={hasNewSpots}
            />
          ))}
        </View>
      ) : (
        <Text
          className="text-gray-400"
          style={{ fontSize: moderateScale(13), marginTop: verticalScale(14) }}
        >
          {result ? "지금은 보이는 관광지가 없어요" : "주변을 살펴보는 중이에요…"}
        </Text>
      )}
    </Section>
  );
}

/** side(좌/우)를 가장 크게 보여주는 관광지 카드. */
function SpotCard({
  item,
  highlight,
}: {
  item: ScenicSpotItem;
  highlight: boolean;
}) {
  const left = item.side === "left";
  return (
    <View
      className="flex-row items-center"
      style={{
        backgroundColor: CARD_BG,
        borderRadius: scale(10),
        paddingHorizontal: scale(14),
        paddingVertical: verticalScale(12),
        gap: scale(12),
      }}
    >
      {/* 창밖 방향 — 화살표 + 라벨을 한 덩어리로 크게 */}
      <View
        className="items-center justify-center"
        style={{
          width: scale(58),
          paddingVertical: verticalScale(6),
          borderRadius: scale(8),
          backgroundColor: "#FFFFFF",
        }}
      >
        <Feather
          name={left ? "arrow-left" : "arrow-right"}
          size={moderateScale(18)}
          color={MINT}
        />
        <Text
          className="font-bold"
          style={{
            fontSize: moderateScale(11),
            color: MINT,
            marginTop: verticalScale(2),
          }}
        >
          {sideLabel(item.side)}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <View className="flex-row items-center" style={{ gap: scale(6) }}>
          <Text
            className="font-bold text-gray-900"
            style={{ fontSize: moderateScale(15) }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {highlight ? (
            <View
              style={{
                paddingHorizontal: scale(6),
                paddingVertical: verticalScale(2),
                borderRadius: scale(4),
                backgroundColor: "#EEF2FF",
              }}
            >
              <Text
                className="font-bold"
                style={{ fontSize: moderateScale(10), color: ACCENT }}
              >
                NEW
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          className="text-gray-500"
          style={{ fontSize: moderateScale(12), marginTop: verticalScale(3) }}
        >
          {item.category} · {formatDistance(item.distance_m)}
        </Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 공통 섹션 껍데기                                                      */
/* ------------------------------------------------------------------ */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        paddingHorizontal: scale(20),
        marginTop: verticalScale(16),
      }}
    >
      <Text
        className="font-bold text-gray-900"
        style={{ fontSize: moderateScale(16), marginBottom: verticalScale(10) }}
      >
        실시간 창밖 풍경
      </Text>
      {children}
    </View>
  );
}
