import { ActivityIndicator, Pressable, View } from "react-native";

import { useConfirmDialog } from "@/src/components/ConfirmDialog";
import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { describeScenicError } from "../errors";
import { formatBasedAt, parseWallClock } from "../format";
import { MOCK_LOCATION, MOCK_MANUAL } from "../location";
import { calibrateNow, useMinuteTick, useScenicPlanQuery } from "../queries";
import { useScenicStore } from "../store";
import type { ScenicPlanItem, ScenicPlanResponse } from "../types";
import PlanSpotCard from "./PlanSpotCard";

const SIDE_ACCENT = "#668DFF";

/** 목업 좌표를 손으로 한 칸씩 밀어 보정을 확인하는 개발용 버튼을 그릴지. */
const SHOW_MOCK_STEP_BUTTON = __DEV__ && MOCK_LOCATION && MOCK_MANUAL;

/**
 * 여행 상세 타임라인의 승차 ↔ 하차 사이에 끼는 창밖 풍경 시각표.
 *
 * **탑승 중인 그 구간에만 나타난다.** 세션은 메모리 스토어(persist 없음)라
 * 탑승 종료·도착·앱 재시작이면 저절로 사라진다 — 따로 지울 것이 없다.
 *
 * 알림 자체는 서버가 시각표대로 보낸다. 이 행은 "앞으로 무엇을 언제 지나는지"를
 * 보여주는 안내판이고, 여기서 무엇을 하든 알림 발송에는 영향이 없다.
 *
 * 바깥 컴포넌트는 "내 구간인가"만 구독한다. 일정표의 모든 열차 행에 하나씩 붙는데,
 * 여기서 시각표까지 구독하면 갱신 한 번에 타지도 않는 행들까지 전부 다시 그려진다.
 * 실시간 상태는 탑승 중인 그 한 행(RidingRow)만 본다.
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

/** 탑승 중인 구간의 실제 내용 — 여기서만 시각표를 구독한다. */
function RidingRow({
  railWidth,
  railGap,
  railColor,
}: {
  railWidth: number;
  railGap: number;
  railColor: string;
}) {
  const label = useScenicStore((s) => s.session?.label ?? "");
  const stopRiding = useScenicStore((s) => s.stopRiding);
  const { data: plan, error, isPending, isFetching } = useScenicPlanQuery();
  const now = useMinuteTick();
  // OS 기본 Alert 대신 앱 UI 다이얼로그 — 신고·차단·삭제와 같은 톤을 쓴다.
  const { dialog, ask } = useConfirmDialog();

  // 코레일 열차운행정보에 SRT 가 없어 서버가 정차역을 모른다 → 시각표도 알림도 없다.
  // 빈 시각표를 "풍경이 없다"로 보여주면 오해라, 이유를 그대로 알린다.
  const isSrt = label.toUpperCase().includes("SRT");

  // 직접 끈 구간은 도착 시각 전이라도 자동으로 다시 켜지지 않는다(skipAuto).
  const onStop = () =>
    ask({
      title: "창밖 풍경 안내를 끌까요?",
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
          {/* 서버 응답 시각. 첫 조회 전에는 보여줄 시각이 없어 생략한다. */}
          {plan?.based_at ? (
            <Text
              className="text-gray-400"
              style={{ fontSize: moderateScale(11) }}
            >
              · {formatBasedAt(plan.based_at)} 기준
            </Text>
          ) : null}
          {plan ? <DelayChip minutes={plan.delay_minutes} /> : null}
          {isFetching ? <ActivityIndicator size="small" color={SIDE_ACCENT} /> : null}

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
            accessibilityLabel="창밖 풍경 안내 끄기"
          >
            <Text
              className="font-semibold text-gray-500"
              style={{ fontSize: moderateScale(11) }}
            >
              안내 끄기
            </Text>
          </Pressable>
        </View>

        <Body
          isSrt={isSrt}
          error={error}
          pending={isPending}
          plan={plan}
          now={now}
        />

        {SHOW_MOCK_STEP_BUTTON ? (
          <MockStepButton
            onPress={() => void calibrateNow({ force: true })}
            disabled={isFetching}
          />
        ) : null}

        {dialog}
      </View>
    </View>
  );
}

/** "지연 12분" / "3분 빠름". 0 이면 그리지 않는다. */
function DelayChip({ minutes }: { minutes: number }) {
  if (!minutes) return null;
  const late = minutes > 0;
  return (
    <View
      style={{
        paddingHorizontal: scale(6),
        paddingVertical: verticalScale(2),
        borderRadius: scale(4),
        backgroundColor: late ? "#FEF3C7" : "#DCFCE7",
      }}
    >
      <Text
        className="font-bold"
        style={{
          fontSize: moderateScale(10),
          color: late ? "#B45309" : "#15803D",
        }}
      >
        {late ? `지연 ${minutes}분` : `${-minutes}분 빠름`}
      </Text>
    </View>
  );
}

function Body({
  isSrt,
  error,
  pending,
  plan,
  now,
}: {
  isSrt: boolean;
  error: unknown;
  pending: boolean;
  plan: ScenicPlanResponse | undefined;
  now: Date;
}) {
  if (isSrt) {
    return (
      <Hint text="SRT는 정차역 정보가 제공되지 않아 창밖 풍경 안내를 지원하지 않아요." />
    );
  }
  // 실패 사유를 감추면 인증 문제인지 서버 문제인지 알 수 없다 — 그대로 노출한다.
  if (error) return <Hint text={describeScenicError(error)} />;
  // 탑승 직후, 첫 조회가 아직 안 끝난 상태.
  if (pending || !plan) return <Hint text="창밖 풍경 시각표를 불러오는 중이에요." />;
  if (!plan.ride || plan.items.length === 0) {
    return <Hint text="이 구간에는 알려드릴 풍경이 없어요." />;
  }

  // "지나갔는지"는 eta 와 지금 시각으로 판단한다. is_sent 는 서버가 푸시를 보냈다는
  // 표시라 12분 묶음·중복 방지로 안 보낸 곳은 eta 가 지나도 false 로 남는다.
  const passed = plan.items.map((item) => hasPassed(item, now));
  const nextIdx = passed.indexOf(false);

  return (
    <View style={{ gap: verticalScale(8) }}>
      {plan.items.map((item, i) => (
        <PlanSpotCard
          key={item.scenic_spot_idx}
          item={item}
          passed={passed[i]}
          primary={i === nextIdx}
        />
      ))}
      <Hint text="통과 시각은 열차 시간표로 계산한 예상이에요. 시각이 되면 알림으로 알려드려요." />
    </View>
  );
}

function hasPassed(item: ScenicPlanItem, now: Date): boolean {
  const eta = parseWallClock(item.eta);
  return eta !== null && eta.getTime() <= now.getTime();
}

/**
 * 개발용 — 누를 때마다 목업 좌표가 노선을 따라 한 칸(약 1km) 전진하고 그 좌표로
 * 보정을 보낸다. 좌표를 미는 주체는 location.ts 의 getCurrentLatLng 이라, 여기서는
 * 보정만 시키면 된다. 릴리스 빌드에는 __DEV__ 가드로 아예 포함되지 않는다.
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
      accessibilityLabel="목업 위치 한 칸 이동 후 보정"
    >
      <Text
        className="font-semibold"
        style={{ fontSize: moderateScale(11), color: SIDE_ACCENT }}
      >
        [DEV] 다음 위치로 보정
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
