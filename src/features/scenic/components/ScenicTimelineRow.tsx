import { ActivityIndicator, View } from "react-native";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { formatBasedAt } from "../format";
import { useScenicStore } from "../store";
import SpotCard from "./SpotCard";

const SIDE_ACCENT = "#668DFF";

/**
 * 여행 상세 타임라인의 승차 ↔ 하차 사이에 끼는 실시간 창밖 풍경 목록.
 *
 * **탑승 중인 그 구간에만 나타난다.** 세션은 메모리 스토어(persist 없음)라
 * 탑승 종료·도착·앱 재시작이면 저절로 사라진다 — 따로 지울 것이 없다.
 *
 * 이 컴포넌트는 폴링을 걸지 않는다. 조회는 앱 루트의 AutoBoarding 이
 * useScenicPolling 으로 한 곳에서만 돌리고, 여기서는 결과만 읽는다
 * (여기서 또 구독하면 호출이 늘고, 호출 1건이 곧 알림 1건이다).
 */
export default function ScenicTimelineRow({
  scheduleIdx,
  railWidth,
  railGap,
  railColor,
}: {
  /** 이 행이 붙는 승차 항목. 탑승 중인 구간과 같을 때만 그린다. */
  scheduleIdx: number;
  railWidth: number;
  railGap: number;
  railColor: string;
}) {
  const riding = useScenicStore((s) => s.session?.scheduleIdx === scheduleIdx);
  const result = useScenicStore((s) => s.lastResponse);
  const loading = useScenicStore((s) => s.loading);
  const error = useScenicStore((s) => s.error);
  const hasNewSpots = useScenicStore((s) => s.hasNewSpots);

  if (!riding) return null;

  return (
    <View style={{ flexDirection: "row" }}>
      {/* 레일 — 번호 없는 작은 점. 아래(하차)로 선이 계속 이어진다. */}
      <View style={{ width: railWidth, alignItems: "center", marginRight: railGap }}>
        <View
          style={{
            width: scale(8),
            height: scale(8),
            borderRadius: scale(4),
            backgroundColor: SIDE_ACCENT,
            marginTop: verticalScale(6),
          }}
        />
        <View style={{ flex: 1, width: 2, backgroundColor: railColor }} />
      </View>

      <View style={{ flex: 1, paddingBottom: verticalScale(12) }}>
        <View
          className="flex-row items-center"
          style={{ gap: scale(6), marginBottom: verticalScale(8) }}
        >
          <Text
            className="font-bold"
            style={{ fontSize: moderateScale(13), color: SIDE_ACCENT }}
          >
            창밖 풍경
          </Text>
          {/* 서버 조회 시각. 첫 조회 전에는 보여줄 시각이 없어 생략한다. */}
          {result?.based_at ? (
            <Text
              className="text-gray-400"
              style={{ fontSize: moderateScale(11) }}
            >
              · {formatBasedAt(result.based_at)} 기준
            </Text>
          ) : null}
          {loading ? <ActivityIndicator size="small" color={SIDE_ACCENT} /> : null}
        </View>

        <Body error={error} result={result} hasNewSpots={hasNewSpots} />
      </View>
    </View>
  );
}

function Body({
  error,
  result,
  hasNewSpots,
}: {
  error: string | null;
  result: ReturnType<typeof useScenicStore.getState>["lastResponse"];
  hasNewSpots: boolean;
}) {
  // 실패 사유를 감추면 위치 권한 문제인지 서버 문제인지 알 수 없다 — 그대로 노출한다.
  if (error) return <Hint text={error} />;
  // 탑승 직후, 첫 조회가 아직 안 끝난 상태.
  if (!result) return <Hint text="주변 관광지를 찾는 중이에요." />;
  if (result.items.length === 0) {
    return <Hint text="지금 구간에는 알려드릴 관광지가 없어요." />;
  }

  return (
    <View style={{ gap: verticalScale(8) }}>
      {result.items.map((item, i) => (
        <SpotCard
          key={`${item.name}-${item.distance_m}`}
          item={item}
          // 직전 조회에 없던 곳이 있을 때만 강조한다(같은 곳 반복이면 조용히).
          highlight={hasNewSpots}
          // 서버가 거리순으로 주므로 첫 장이 가장 가까운 곳이다.
          primary={i === 0}
        />
      ))}
    </View>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <Text
      className="text-gray-400"
      style={{ fontSize: moderateScale(12), lineHeight: moderateScale(18) }}
    >
      {text}
    </Text>
  );
}
