import { Image, type ImageSource } from "expo-image";
import { useRef, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const SELECTION = "#E5484D";

/** 눈금 간격(초) — 영상이 길면 촘촘해지지 않게 단계별로 키운다. */
function tickStep(duration: number): number {
  if (duration <= 15) return 2;
  if (duration <= 40) return 5;
  if (duration <= 120) return 10;
  return 30;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** "0:07" — 눈금·핸들 라벨 공용(짧게). */
function label(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Props = {
  /** 전체 길이(초). 0 이면 아직 메타데이터를 못 읽은 상태 — 트랙만 그린다. */
  duration: number;
  /** 재생 위치(초) — 재생 중에는 호출부가 주기적으로 갱신한다. */
  position: number;
  /** 구간 선택 모드. 켜면 좌우로 늘릴 수 있는 선택 영역이 나온다. */
  editing: boolean;
  /** 선택 구간(초). editing 일 때만 쓴다. */
  range: { start: number; end: number };
  /** 클립 바에 깔 프레임 사진들(시간순). 없으면 단색 바로 그린다. */
  thumbnails?: ImageSource[];
  /** 재생헤드를 끄는 동안 계속 불린다 — 그 시점 프레임을 보여주면 된다. */
  onSeek: (seconds: number) => void;
  /** 드래그 시작/끝 — 호출부가 재생을 멈췄다가 마지막 위치로 확정한다. */
  onScrubStart?: () => void;
  onScrubEnd?: (seconds: number) => void;
  onRangeChange: (range: { start: number; end: number }) => void;
};

/**
 * 영상 편집 타임라인 — 눈금자 + 클립 바 + 재생헤드(드래그로 탐색) + 구간 선택 핸들.
 *
 * 제스처는 runOnJS 로 잡는다(트랙 하나에 View 몇 개뿐이라 UI 스레드 애니메이션까지
 * 갈 이유가 없다). 좌표는 전부 "초 ↔ px" 한 쌍의 변환으로만 다룬다.
 */
export default function VideoTimeline({
  duration,
  position,
  editing,
  range,
  thumbnails = [],
  onSeek,
  onScrubStart,
  onScrubEnd,
  onRangeChange,
}: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  // 재생헤드를 끄는 동안에는 position prop(폴링값)이 손가락을 따라오지 못해 튄다.
  const [dragging, setDragging] = useState<number | null>(null);

  const safeDuration = duration > 0 ? duration : 0;
  const toPx = (seconds: number) =>
    safeDuration > 0 ? (seconds / safeDuration) * trackWidth : 0;
  const toSeconds = (px: number) =>
    safeDuration > 0 ? (clamp(px, 0, trackWidth) / trackWidth) * safeDuration : 0;

  const shown = dragging ?? position;

  // 트랙 아무 데나 누르거나 끌면 그 시점으로 이동.
  // 마지막 위치는 ref 로 들고 있다가 손을 뗄 때 한 번 더 확정한다(중간 seek 는 스로틀됨).
  const lastSeconds = useRef(0);
  const scrub = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      const seconds = toSeconds(e.x);
      lastSeconds.current = seconds;
      setDragging(seconds);
      onScrubStart?.();
      onSeek(seconds);
    })
    .onUpdate((e) => {
      const seconds = toSeconds(e.x);
      lastSeconds.current = seconds;
      setDragging(seconds);
      onSeek(seconds);
    })
    .onFinalize(() => {
      setDragging(null);
      onScrubEnd?.(lastSeconds.current);
    });

  // 선택 구간 좌/우 핸들 — 서로를 넘어가지 못하게 0.2초 여유를 둔다.
  const handleGesture = (edge: "start" | "end") =>
    Gesture.Pan()
      .runOnJS(true)
      .minDistance(0)
      .onUpdate((e) => {
        const seconds = toSeconds(toPx(range[edge]) + e.translationX);
        if (edge === "start") {
          onRangeChange({ ...range, start: clamp(seconds, 0, range.end - 0.2) });
        } else {
          onRangeChange({
            ...range,
            end: clamp(seconds, range.start + 0.2, safeDuration),
          });
        }
      });

  const step = tickStep(safeDuration || 10);
  const ticks: number[] = [];
  for (let t = 0; t <= safeDuration; t += step) ticks.push(t);

  return (
    <View style={{ gap: verticalScale(4) }}>
      {/* 눈금자 */}
      <View style={{ height: verticalScale(14) }}>
        {ticks.map((t) => (
          <Text
            key={t}
            className="absolute text-gray-500"
            style={{ left: toPx(t), fontSize: moderateScale(9) }}
          >
            |{label(t)}
          </Text>
        ))}
      </View>

      <GestureDetector gesture={scrub}>
        <View
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          style={{ height: verticalScale(56), justifyContent: "center" }}
        >
          {/* 클립 바 — 프레임 사진을 이어 붙인 필름스트립(없으면 단색) */}
          <View
            className="flex-row overflow-hidden"
            style={{
              height: verticalScale(48),
              borderRadius: scale(6),
              backgroundColor: "#1E4B4F",
              borderWidth: 1,
              borderColor: "#2E6B70",
            }}
          >
            {thumbnails.map((thumb, i) => (
              <Image
                key={i}
                source={thumb}
                style={{ flex: 1, height: "100%" }}
                contentFit="cover"
              />
            ))}
            <Text
              className="absolute text-white"
              style={{
                left: scale(6),
                top: verticalScale(3),
                fontSize: moderateScale(9),
                textShadowColor: "rgba(0,0,0,0.8)",
                textShadowRadius: 3,
              }}
              numberOfLines={1}
            >
              내 영상 {safeDuration > 0 ? label(safeDuration) : ""}
            </Text>
          </View>

          {/* 선택 구간 — 좌우 핸들로 늘린다 */}
          {editing && trackWidth > 0 ? (
            <>
              <View
                pointerEvents="none"
                className="absolute"
                style={{
                  left: toPx(range.start),
                  width: Math.max(2, toPx(range.end) - toPx(range.start)),
                  height: verticalScale(48),
                  backgroundColor: "rgba(229,72,77,0.35)",
                  borderColor: SELECTION,
                  borderWidth: 1,
                  borderRadius: scale(4),
                }}
              />
              <Handle
                gesture={handleGesture("start")}
                left={toPx(range.start)}
                text={label(range.start)}
                alignLabel="left"
              />
              <Handle
                gesture={handleGesture("end")}
                left={toPx(range.end)}
                text={label(range.end)}
                alignLabel="right"
              />
            </>
          ) : null}

          {/* 재생헤드 */}
          <View
            pointerEvents="none"
            className="absolute"
            style={{
              left: toPx(shown) - 1,
              width: 2,
              height: verticalScale(56),
              backgroundColor: "#FFFFFF",
            }}
          />
          <View
            pointerEvents="none"
            className="absolute"
            style={{
              left: toPx(shown) - scale(5),
              top: 0,
              width: scale(10),
              height: scale(10),
              borderRadius: scale(5),
              backgroundColor: "#FFFFFF",
            }}
          />
        </View>
      </GestureDetector>

      <Text
        className="text-gray-400"
        style={{ fontSize: moderateScale(11) }}
      >
        {editing
          ? `선택 ${label(range.start)} ~ ${label(range.end)} · 양끝을 끌어 조절`
          : `${label(shown)}${safeDuration > 0 ? ` / ${label(safeDuration)}` : ""} · 타임라인을 끌어 이동`}
      </Text>
    </View>
  );
}

/** 선택 구간 끝에 붙는 손잡이. 얇아서 좌우로 넉넉한 hitSlop 을 준다. */
function Handle({
  gesture,
  left,
  text,
  alignLabel,
}: {
  gesture: ReturnType<typeof Gesture.Pan>;
  left: number;
  text: string;
  alignLabel: "left" | "right";
}) {
  return (
    <GestureDetector gesture={gesture}>
      <View
        hitSlop={{ left: scale(14), right: scale(14), top: 8, bottom: 8 }}
        className="absolute items-center justify-center"
        style={{
          left: left - scale(7),
          width: scale(14),
          height: verticalScale(48),
          borderRadius: scale(4),
          backgroundColor: SELECTION,
        }}
      >
        <View
          style={{
            width: scale(2),
            height: verticalScale(16),
            backgroundColor: "#FFFFFF",
            borderRadius: 1,
          }}
        />
        <Text
          className="absolute text-white"
          style={{
            top: -verticalScale(14),
            fontSize: moderateScale(9),
            [alignLabel]: 0,
          }}
        >
          {text}
        </Text>
      </View>
    </GestureDetector>
  );
}
