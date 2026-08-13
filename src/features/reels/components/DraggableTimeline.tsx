import { Image } from "expo-image";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import type { ReelsMediaAsset } from "../types";

type Props = {
  assets: ReelsMediaAsset[];
  thumbW: number;
  thumbH: number;
  gap: number;
  selectedUri: string | null;
  onSelect: (uri: string) => void;
  onReorder: (from: number, to: number) => void;
  labelFor: (index: number) => string;
};

/**
 * 가로 타임라인 + 길게 눌러 드래그 정렬.
 *
 * react-native-reorderable-list 가 New Architecture(Fabric)에서 크래시나서
 * gesture-handler + reanimated 로 직접 구현한다. 드래그 중에는 스크롤을 잠근다.
 * 순서 확정은 놓는 순간 이동 칸 수(translationX / 슬롯폭)로 계산한다.
 */
export default function DraggableTimeline({
  assets,
  thumbW,
  thumbH,
  gap,
  selectedUri,
  onSelect,
  onReorder,
  labelFor,
}: Props) {
  const [scrollEnabled, setScrollEnabled] = useState(true);

  return (
    <ScrollView
      horizontal
      scrollEnabled={scrollEnabled}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: scale(16) }}
    >
      {assets.map((asset, index) => (
        <DraggableThumb
          key={asset.uri}
          asset={asset}
          index={index}
          count={assets.length}
          thumbW={thumbW}
          thumbH={thumbH}
          gap={gap}
          active={selectedUri === asset.uri}
          label={labelFor(index)}
          onSelect={() => onSelect(asset.uri)}
          onReorder={onReorder}
          onDragChange={(dragging) => setScrollEnabled(!dragging)}
        />
      ))}
    </ScrollView>
  );
}

function DraggableThumb({
  asset,
  index,
  count,
  thumbW,
  thumbH,
  gap,
  active,
  label,
  onSelect,
  onReorder,
  onDragChange,
}: {
  asset: ReelsMediaAsset;
  index: number;
  count: number;
  thumbW: number;
  thumbH: number;
  gap: number;
  active: boolean;
  label: string;
  onSelect: () => void;
  onReorder: (from: number, to: number) => void;
  onDragChange: (dragging: boolean) => void;
}) {
  const tx = useSharedValue(0);
  const dragging = useSharedValue(false);

  // 제스처 translationX 는 실제 화면 픽셀이므로 슬롯 폭도 scale 적용값으로 계산
  const slotWidth = scale(thumbW) + scale(gap);

  const pan = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart(() => {
      dragging.value = true;
      runOnJS(onDragChange)(true);
    })
    .onUpdate((e) => {
      tx.value = e.translationX;
    })
    .onEnd((e) => {
      // 이동한 슬롯 수만큼 목표 인덱스 계산 (범위 클램프)
      const offset = Math.round(e.translationX / slotWidth);
      let target = index + offset;
      if (target < 0) target = 0;
      if (target > count - 1) target = count - 1;
      if (target !== index) runOnJS(onReorder)(index, target);
      tx.value = 0;
      dragging.value = false;
      runOnJS(onDragChange)(false);
    });

  // 짧게 탭하면 미리보기 선택
  const tap = Gesture.Tap().onEnd(() => runOnJS(onSelect)());
  const gesture = Gesture.Race(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { scale: dragging.value ? 1.06 : 1 },
    ],
    zIndex: dragging.value ? 10 : 0,
    opacity: dragging.value ? 0.92 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ marginRight: scale(gap) }, animatedStyle]}>
        <Image
          source={{ uri: asset.uri }}
          contentFit="cover"
          style={{
            width: scale(thumbW),
            height: scale(thumbH),
            borderWidth: active ? 2 : 0,
            borderColor: "#FFFFFF",
          }}
        />

        {/* 영상에 나오는 순서 — 보낸 순서가 곧 영상 순서라 번호로 못박아 보여준다. */}
        <View
          className="absolute items-center justify-center"
          pointerEvents="none"
          style={{
            top: scale(4),
            left: scale(4),
            width: scale(18),
            height: scale(18),
            borderRadius: scale(9),
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        >
          <Text
            className="font-bold text-white"
            style={{ fontSize: moderateScale(10) }}
          >
            {index + 1}
          </Text>
        </View>
        <View pointerEvents="none">
          <Text
            className="text-gray-400"
            style={{
              fontSize: moderateScale(10),
              marginTop: verticalScale(4),
            }}
          >
            {label}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
