import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";
const LINE = "#D9DCE1";

/** 한 칸 높이. 가운데 1칸 + 위아래 1칸씩만 보이게 잡는다. */
const ITEM_H = verticalScale(46);
const VISIBLE_ROWS = 3;

const MERIDIEMS = ["오전", "오후"] as const;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
/** 분은 5분 단위. 기존 값이 5의 배수가 아니면 가장 가까운 칸으로 맞춰진다. */
const MINUTE_STEP = 5;
const MINUTES = Array.from(
  { length: 60 / MINUTE_STEP },
  (_, i) => i * MINUTE_STEP,
);

type Parsed = { meridiemIdx: number; hourIdx: number; minuteIdx: number };

/** "HH:MM"(24시) → 휠 인덱스. 값이 없거나 이상하면 오전 9:00. */
function parseValue(hhmm: string): Parsed {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  const h24 = m ? Number(m[1]) : 9;
  const min = m ? Number(m[2]) : 0;
  if (!m || h24 > 23 || min > 59) return { meridiemIdx: 0, hourIdx: 8, minuteIdx: 0 };
  return {
    meridiemIdx: h24 < 12 ? 0 : 1,
    hourIdx: (h24 % 12 === 0 ? 12 : h24 % 12) - 1,
    // 5분 단위로 반올림. 57분 → 60분이 되면 마지막 칸(55분)으로 눌러 담는다.
    minuteIdx: Math.min(
      MINUTES.length - 1,
      Math.round(min / MINUTE_STEP),
    ),
  };
}

/** 휠 인덱스 → "HH:MM"(24시). */
function toHhmm({ meridiemIdx, hourIdx, minuteIdx }: Parsed): string {
  const h12 = HOURS[hourIdx];
  const h24 = meridiemIdx === 0 ? h12 % 12 : (h12 % 12) + 12;
  const min = MINUTES[minuteIdx];
  return `${String(h24).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/**
 * 하단에서 올라오는 시각 선택 시트 — 오전/오후 · 시 · 분 휠.
 *
 * 피커 라이브러리를 쓰지 않고 ScrollView 스냅으로 만들었다(새 네이티브 의존성 없이
 * prebuild 재빌드를 피하기 위함). 각 열은 위아래 1칸씩만 보이고 가운데로 스냅된다.
 *
 * ⚠️ **Modal 이 아니라 화면을 덮는 절대배치 오버레이다.**
 *    이 시트는 이미 Modal 인 폼 화면(ModalShell) 위에 뜨는데, 안드로이드에서
 *    Modal 안에 Modal 을 넣으면 안쪽이 별개의 윈도우로 떠서 그 안의 ScrollView 가
 *    터치를 못 받는다(휠이 아예 안 굴러감). 같은 윈도우 안의 오버레이로 두면
 *    평범한 뷰 계층이라 스크롤이 정상 동작한다.
 *    → ModalShell 이 자기 SafeAreaView 안에서 이 컴포넌트를 렌더한다.
 */
export default function TimeWheelSheet({
  value,
  label,
  onClose,
  onConfirm,
}: {
  /** 현재 값 "HH:MM"(24시). 비어 있으면 오전 9:00 에서 시작. */
  value: string;
  /** 시트 상단에 보여줄 문구(예: "방문 시각") */
  label?: string;
  onClose: () => void;
  onConfirm: (hhmm: string) => void;
}) {
  // 열 때마다 새로 마운트되므로(호출부가 조건부 렌더) 초기값만 잡으면 된다.
  const [sel, setSel] = useState<Parsed>(() => parseValue(value));
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
    >
      {/* 백드롭 — 탭하면 닫힘 */}
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
      />
      {/*
        시트 본체. 백드롭이 형제 뷰라 여기 터치는 애초에 백드롭까지 가지 않는다.
        (Pressable 로 감싸면 안쪽 휠 ScrollView 가 터치를 못 받을 수 있어 View 로 둔다.)
      */}
      <View
        className="bg-white"
        style={{
          borderTopLeftRadius: scale(20),
          borderTopRightRadius: scale(20),
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(18),
          // 내비게이션 바(제스처 바 포함)에 확인 버튼이 가리지 않도록 인셋 가산.
          paddingBottom: insets.bottom + verticalScale(16),
        }}
      >
          {label ? (
            <Text
              className="font-bold text-gray-900 text-center"
              style={{
                fontSize: moderateScale(15),
                marginBottom: verticalScale(8),
              }}
            >
              {label}
            </Text>
          ) : null}

          <View
            className="flex-row justify-center"
            style={{ height: ITEM_H * VISIBLE_ROWS, gap: scale(16) }}
          >
            <Wheel
              width={scale(80)}
              labels={MERIDIEMS as unknown as string[]}
              initialIndex={sel.meridiemIdx}
              onIndexChange={(i) => setSel((s) => ({ ...s, meridiemIdx: i }))}
            />
            <Wheel
              width={scale(70)}
              labels={HOURS.map(String)}
              initialIndex={sel.hourIdx}
              onIndexChange={(i) => setSel((s) => ({ ...s, hourIdx: i }))}
            />
            <Wheel
              width={scale(70)}
              labels={MINUTES.map((m) => String(m).padStart(2, "0"))}
              initialIndex={sel.minuteIdx}
              onIndexChange={(i) => setSel((s) => ({ ...s, minuteIdx: i }))}
            />
          </View>

          <Pressable
            onPress={() => onConfirm(toHhmm(sel))}
            className="items-center justify-center active:opacity-80"
            style={{
              marginTop: verticalScale(20),
              height: verticalScale(52),
              borderRadius: scale(12),
              backgroundColor: ACCENT,
            }}
            accessibilityRole="button"
          >
            <Text
              className="text-white font-bold"
              style={{ fontSize: moderateScale(16) }}
            >
              확인
            </Text>
          </Pressable>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 휠 한 열                                                             */
/* ------------------------------------------------------------------ */
function Wheel({
  labels,
  initialIndex,
  onIndexChange,
  width,
}: {
  labels: string[];
  /** 처음 보여줄 위치. 마운트 시 한 번만 쓴다(시트를 닫으면 언마운트되므로 다음에 열 때 갱신). */
  initialIndex: number;
  onIndexChange: (index: number) => void;
  width: number;
}) {
  const ref = useRef<ScrollView>(null);
  // 스크롤 중 굵게 표시할 위치. 스냅이 끝나기 전에도 가운데 값이 강조되도록 별도 관리.
  const [active, setActive] = useState(initialIndex);

  /**
   * ⚠️ 스크롤 위치를 부모 상태에 되먹여 scrollTo 로 되돌리면 안 된다.
   *    손을 떼는 순간(onScrollEndDrag)은 아직 관성이 남아 있는 중간 위치라,
   *    그 값으로 scrollTo 하면 사용자가 굴린 휠이 제자리로 튕겨 돌아온다
   *    (= 아예 안 움직이는 것처럼 보임). 마운트 때 한 번만 위치를 잡고,
   *    그 뒤로는 스크롤을 건드리지 않는다.
   */
  const positioned = useRef(false);
  const startIndex = useRef(initialIndex);
  const placeInitial = () => {
    if (positioned.current) return;
    positioned.current = true;
    // contentOffset prop 은 iOS 전용이라 안드로이드에서는 scrollTo 로 잡아야 한다.
    ref.current?.scrollTo({ y: startIndex.current * ITEM_H, animated: false });
  };

  const clampIndex = (y: number) =>
    Math.max(0, Math.min(labels.length - 1, Math.round(y / ITEM_H)));

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = clampIndex(e.nativeEvent.contentOffset.y);
    if (next === active) return;
    setActive(next);
    // 한 칸 넘어갈 때마다 톡 — 물리 다이얼 같은 감각.
    void Haptics.selectionAsync();
  };

  // 멈춘 위치를 확정값으로 올린다. 안드로이드는 느리게 놓으면 momentum 이 없어
  // onScrollEndDrag 도 함께 받는다(관성이 이어지면 momentum 쪽이 최종값으로 덮는다).
  const commit = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = clampIndex(e.nativeEvent.contentOffset.y);
    setActive(next);
    onIndexChange(next);
  };

  return (
    <View style={{ width }}>
      {/* 선택 구간 표시선 — 가운데 칸 위·아래 */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: ITEM_H,
          height: ITEM_H,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: LINE,
        }}
      />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={commit}
        onScrollEndDrag={commit}
        onContentSizeChange={placeInitial}
        // 첫·마지막 항목도 가운데로 올 수 있게 위아래 한 칸씩 비워둔다.
        contentContainerStyle={{ paddingVertical: ITEM_H }}
      >
        {labels.map((label, i) => {
          const selected = i === active;
          return (
            <View
              key={label}
              className="items-center justify-center"
              style={{ height: ITEM_H }}
            >
              <Text
                className={selected ? "font-bold" : "font-medium"}
                style={{
                  fontSize: moderateScale(selected ? 19 : 17),
                  color: selected ? "#111827" : "#C4C9D4",
                }}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
