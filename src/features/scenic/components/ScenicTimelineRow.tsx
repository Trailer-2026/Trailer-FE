import { ActivityIndicator, Pressable, View } from "react-native";

import { useConfirmDialog } from "@/src/components/ConfirmDialog";
import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { formatBasedAt } from "../format";
import { MOCK_LOCATION, MOCK_MANUAL } from "../location";
import { useScenicPolling } from "../queries";
import { useScenicStore } from "../store";
import SpotCard from "./SpotCard";

const SIDE_ACCENT = "#668DFF";

/** 목업 좌표를 손으로 한 칸씩 밀어보는 개발용 버튼을 그릴지. */
const SHOW_MOCK_STEP_BUTTON = __DEV__ && MOCK_LOCATION && MOCK_MANUAL;

/**
 * 여행 상세 타임라인의 승차 ↔ 하차 사이에 끼는 실시간 창밖 풍경 목록.
 *
 * **탑승 중인 그 구간에만 나타난다.** 세션은 메모리 스토어(persist 없음)라
 * 탑승 종료·도착·앱 재시작이면 저절로 사라진다 — 따로 지울 것이 없다.
 *
 * 이 컴포넌트는 폴링을 걸지 않는다. 조회는 앱 루트의 AutoBoarding 이
 * useScenicPolling 으로 한 곳에서만 돌리고, 여기서는 결과만 읽는다
 * (여기서 또 구독하면 호출이 늘고, 호출 1건이 곧 알림 1건이다).
 *
 * 바깥 컴포넌트는 "내 구간인가"만 구독한다. 일정표의 모든 열차 행에 하나씩 붙는데,
 * 여기서 loading/lastResponse 까지 구독하면 폴링 한 번에 타지도 않는 행들까지
 * 전부 다시 그려진다(loading 이 true/false 로 두 번 바뀐다). 실시간 상태는
 * 탑승 중인 그 한 행(RidingRow)만 본다.
 */
export default function ScenicTimelineRow({
  scheduleIdx,
  ...rail
}: {
  /** 이 행이 붙는 승차 항목. 탑승 중인 구간과 같을 때만 그린다. */
  scheduleIdx: number;
  railWidth: number;
  railGap: number;
  railColor: string;
}) {
  const riding = useScenicStore((s) => s.session?.scheduleIdx === scheduleIdx);
  if (!riding) return null;
  return <RidingRow {...rail} />;
}

/** 탑승 중인 구간의 실제 내용 — 여기서만 폴링 상태를 구독한다. */
function RidingRow({
  railWidth,
  railGap,
  railColor,
}: {
  railWidth: number;
  railGap: number;
  railColor: string;
}) {
  const result = useScenicStore((s) => s.lastResponse);
  const loading = useScenicStore((s) => s.loading);
  const error = useScenicStore((s) => s.error);
  const hasNewSpots = useScenicStore((s) => s.hasNewSpots);
  const stopRiding = useScenicStore((s) => s.stopRiding);
  // 이미 AutoBoarding 이 구독 중이라 여기서 훅을 써도 타이머는 하나뿐이다
  // (queries.ts 의 subscribers). refresh 는 간격·이동거리 조건을 무시하고 즉시 호출한다.
  const { refresh } = useScenicPolling();
  // OS 기본 Alert 대신 앱 UI 다이얼로그 — 신고·차단·삭제와 같은 톤을 쓴다.
  const { dialog, ask } = useConfirmDialog();

  // 직접 끈 구간은 도착 시각 전이라도 자동으로 다시 켜지지 않는다(skipAuto).
  const onStop = () =>
    ask({
      title: "창밖 풍경 알림을 끌까요?",
      message: "이 구간에서는 다시 자동으로 켜지지 않아요.",
      confirmLabel: "끄기",
      danger: true,
      onConfirm: () => stopRiding({ skipAuto: true }),
    });

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

          {/* 끄는 버튼은 지금 타고 있는 그 열차 옆에만 둔다 — 어느 구간을 끄는지
              헷갈릴 여지가 없고, 안 타는 동안에는 화면에 남지 않는다. */}
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={onStop}
            hitSlop={8}
            className="active:opacity-60"
            style={{
              paddingHorizontal: scale(10),
              paddingVertical: verticalScale(5),
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              backgroundColor: "#FFFFFF",
            }}
            accessibilityRole="button"
            accessibilityLabel="창밖 풍경 알림 끄기"
          >
            <Text
              className="font-semibold text-gray-500"
              style={{ fontSize: moderateScale(11) }}
            >
              알림 끄기
            </Text>
          </Pressable>
        </View>

        <Body error={error} result={result} hasNewSpots={hasNewSpots} />

        {SHOW_MOCK_STEP_BUTTON ? (
          <MockStepButton onPress={refresh} disabled={loading} />
        ) : null}

        {dialog}
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

/**
 * 개발용 — 누를 때마다 목업 좌표가 노선을 따라 한 칸(약 1km) 전진하고 즉시 재조회한다.
 * 좌표를 미는 주체는 location.ts 의 getCurrentLatLng 이라, 여기서는 조회만 시키면 된다.
 * 릴리스 빌드에는 __DEV__ 가드로 아예 포함되지 않는다.
 */
function MockStepButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="self-start active:opacity-70"
      style={{
        marginTop: verticalScale(8),
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(7),
        borderRadius: 999,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: SIDE_ACCENT,
        opacity: disabled ? 0.5 : 1,
      }}
      accessibilityRole="button"
      accessibilityLabel="목업 위치 한 칸 이동"
    >
      <Text
        className="font-semibold"
        style={{ fontSize: moderateScale(11), color: SIDE_ACCENT }}
      >
        [DEV] 다음 위치로 이동
      </Text>
    </Pressable>
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
