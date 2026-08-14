import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useMemo } from "react";
import { Alert, Pressable, View } from "react-native";

import { Text } from "@/src/components/Text";
import type { TravelDetail } from "@/src/features/travel/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { formatClockLabel } from "../format";
import { ensureForegroundLocationPermission, resetMockLocation } from "../location";
import { useMinuteTick } from "../queries";
import {
  collectTrainSegments,
  findBoardingSuggestion,
  type TrainSegment,
} from "../segments";
import { useIsRiding, useScenicStore } from "../store";

const ACCENT = "#5E84F4";
const CARD_BG = "#F4F4F6";
const BORDER = "#E5E7EB";

/**
 * 예정된 여행 상세의 "기차 탑승" 섹션 — 탑승 상태를 켜고 끄는 곳.
 *
 * - 탑승 중(이 여행의 세션이 있음) → 현재 구간 + '탑승 종료'
 * - 아니면 → 열차 구간별 '탑승 시작' + 출발 시각 ±30분 제안 배너
 * - 열차 구간이 아예 없으면 아무것도 렌더하지 않는다.
 *
 * **실시간 풍경 결과는 여기서 보여주지 않는다.** 관광지 목록·기준 시각·새로고침은
 * 알림 탭의 풍경알림 카드 한 곳에서만 그린다(폴링 구독도 그쪽에만 있다).
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
    resetMockLocation(); // 목업 위치 모드에서만 의미 있음 — 매번 같은 지점에서 출발
    startRiding({
      travelIdx,
      scheduleIdx: seg.scheduleIdx,
      fromStation: seg.fromStation,
      toStation: seg.toStation,
      label: seg.label,
    });
    // 탑승 이후의 주 화면은 알림 탭의 풍경알림 카드다 → 바로 그리로 보낸다.
    // push 가 아니라 navigate — 상세 화면을 스택에 쌓아두지 않고 탭으로 돌아간다.
    router.navigate("/notifications");
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
/* 탑승 중 — 상태 + 탑승 종료                                            */
/*                                                                     */
/* ⚠️ 여기서는 실시간 결과(관광지 top3·기준 시각·새로고침)를 그리지 않는다.  */
/*    풍경 알림을 보여주는 곳은 알림 탭의 풍경알림 카드 한 곳뿐이다.        */
/*    폴링도 걸지 않는다 — 이 화면이 구독하면 호출이 그만큼 늘어난다.       */
/* ------------------------------------------------------------------ */
function RidingPanel() {
  const session = useScenicStore((s) => s.session);
  const stopRiding = useScenicStore((s) => s.stopRiding);

  if (!session) return null;

  const confirmStop = () =>
    Alert.alert("탑승을 종료할까요?", "실시간 풍경 알림이 멈춰요.", [
      { text: "취소", style: "cancel" },
      { text: "종료", style: "destructive", onPress: stopRiding },
    ]);

  return (
    <Section>
      <View
        className="flex-row items-center"
        style={{
          backgroundColor: CARD_BG,
          borderRadius: scale(10),
          paddingHorizontal: scale(14),
          paddingVertical: verticalScale(12),
          gap: scale(10),
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            className="font-bold text-gray-900"
            style={{ fontSize: moderateScale(14) }}
            numberOfLines={1}
          >
            {session.fromStation} → {session.toStation}
          </Text>
          <Text
            className="text-gray-500"
            style={{ fontSize: moderateScale(12), marginTop: verticalScale(2) }}
          >
            {session.label} · 탑승 중
          </Text>
        </View>

        <Pressable
          onPress={confirmStop}
          className="active:opacity-70"
          style={{
            paddingHorizontal: scale(14),
            paddingVertical: verticalScale(8),
            borderRadius: 999,
            borderWidth: 1,
            borderColor: BORDER,
            backgroundColor: "#FFFFFF",
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

      <Text
        className="text-gray-400"
        style={{
          fontSize: moderateScale(12),
          marginTop: verticalScale(8),
          lineHeight: moderateScale(18),
        }}
      >
        창밖으로 보이는 관광지는 알림 탭에서 알려드려요.
      </Text>
    </Section>
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
        기차 탑승
      </Text>
      {children}
    </View>
  );
}
