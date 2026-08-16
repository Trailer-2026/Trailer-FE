import { useMemo } from "react";
import { Alert, Pressable, View } from "react-native";

import { Text } from "@/src/components/Text";
import type { TravelDetail } from "@/src/features/travel/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { collectTrainSegments } from "../segments";
import { useIsRiding, useScenicStore } from "../store";

const CARD_BG = "#F4F4F6";
const BORDER = "#E5E7EB";

/**
 * 예정된 여행 상세의 "기차 탑승" 섹션.
 *
 * - 탑승 중(이 여행의 세션이 있음) → 현재 구간 + '탑승 종료'
 * - 아니면 → 자동 시작 안내 한 줄
 * - 열차 구간이 아예 없으면 아무것도 렌더하지 않는다.
 *
 * **탑승 시작 버튼은 없다.** 열차 출발 시각이 되면 AutoBoarding 이 알아서 켜고,
 * 도착 시각이 지나면 끈다. 여기서 사용자가 할 일은 중간에 끄는 것뿐이다.
 *
 * **실시간 관광지 목록은 여기가 아니라 타임라인 안에 그린다** — 승차 ↔ 하차 사이의
 * ScenicTimelineRow. 창밖을 보는 사람에게는 "지금 이 구간의 어디쯤"이 곧 위치라,
 * 목록도 그 자리에 있어야 읽힌다. 이 섹션은 탑승 상태와 종료 버튼만 맡는다.
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
  return (
    <Section>
      <Text
        className="text-gray-400"
        style={{ fontSize: moderateScale(12), lineHeight: moderateScale(18) }}
      >
        열차 출발 시각이 되면 창밖으로 보이는 관광지를 일정 사이에 보여드려요.
      </Text>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 탑승 중 — 상태 + 탑승 종료                                            */
/*                                                                     */
/* ⚠️ 여기서는 실시간 결과(관광지 top3·기준 시각)를 그리지 않는다.          */
/*    목록은 타임라인의 승차 ↔ 하차 사이(ScenicTimelineRow)에서만 그린다.   */
/*    폴링도 걸지 않는다 — 여기서 또 구독하면 호출이 그만큼 늘어난다.       */
/* ------------------------------------------------------------------ */
function RidingPanel() {
  const session = useScenicStore((s) => s.session);
  const stopRiding = useScenicStore((s) => s.stopRiding);

  if (!session) return null;

  // 직접 종료한 구간은 도착 시각 전이라도 자동으로 다시 켜지 않는다.
  const confirmStop = () =>
    Alert.alert("탑승을 종료할까요?", "실시간 풍경 알림이 멈춰요.", [
      { text: "취소", style: "cancel" },
      {
        text: "종료",
        style: "destructive",
        onPress: () => stopRiding({ skipAuto: true }),
      },
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
        창밖으로 보이는 관광지는 아래 승차 일정에 이어서 보여드려요.
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
