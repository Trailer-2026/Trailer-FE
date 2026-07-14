import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { FlatList, Pressable, View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AddCircleIcon from "@/src/components/icons/AddCircleIcon";
import ShareUpIcon from "@/src/components/icons/ShareUpIcon";
import { Text } from "@/src/components/Text";
import ReelsCard from "@/src/features/reels/components/ReelsCard";
import { useReelsStore } from "@/src/features/reels/store";
import type { Reels } from "@/src/features/reels/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

// "내 여행영상 만들기" 말풍선. 꼬리 제외 본체 108 x 30.
// 꼬리는 본체 오른쪽 위에서 + 아이콘을 향해 비스듬히 뻗는다.
const TOOLTIP_COLOR = "#5E84F4";
const TOOLTIP_WIDTH = 108;
const TOOLTIP_HEIGHT = 30;
const TOOLTIP_RIGHT = 14; // 본체 오른쪽 끝과 화면 우측 사이 간격
const TAIL_WIDTH = 17;
const TAIL_HEIGHT = 21;
// 꼬리 꼭짓점을 + 아이콘 중앙보다 이만큼 더 오른쪽으로 (0 이면 정확히 중앙)
const TAIL_SHIFT = 5;

export default function FeedTab() {
  const insets = useSafeAreaInsets();
  const reels = useReelsStore((s) => s.reels);
  const toggleLike = useReelsStore((s) => s.toggleLike);

  // 카드 1장 = 뷰포트 1개. 탭바를 제외한 실제 높이를 onLayout 으로 재서
  // 페이징 간격과 카드 높이를 항상 일치시킨다(기기별 탭바/내비바 높이 차이 흡수).
  const [viewportHeight, setViewportHeight] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setViewportHeight(e.nativeEvent.layout.height);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Reels }) => (
      <ReelsCard
        reels={item}
        height={viewportHeight}
        onToggleLike={toggleLike}
      />
    ),
    [viewportHeight, toggleLike],
  );

  return (
    <View className="flex-1 bg-black" onLayout={onLayout}>
      <StatusBar style="light" />

      {viewportHeight > 0 ? (
        <FlatList
          data={reels}
          keyExtractor={(item) => String(item.reels_idx)}
          renderItem={renderItem}
          pagingEnabled
          snapToInterval={viewportHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: viewportHeight,
            offset: viewportHeight * index,
            index,
          })}
          windowSize={3}
          removeClippedSubviews
        />
      ) : null}

      {/* 상단 가독성용 그라데이션 — 밝은 썸네일 위에서도 흰 글씨가 보이도록 */}
      <LinearGradient
        colors={["rgba(0,0,0,0.45)", "transparent"]}
        className="absolute inset-x-0 top-0"
        style={{ height: insets.top + verticalScale(90) }}
        pointerEvents="none"
      />

      {/* 상단 헤더 — 홈(index.tsx Header)과 동일한 위치·크기, 색만 흰색 */}
      <View
        className="absolute inset-x-0"
        style={{ top: insets.top }}
        pointerEvents="box-none"
      >
        <View
          className="flex-row items-center justify-between"
          style={{
            paddingHorizontal: scale(20),
            paddingTop: verticalScale(6),
            paddingBottom: verticalScale(4),
          }}
        >
          <Text
            className="font-bold text-white"
            style={{ fontSize: moderateScale(17) }}
          >
            트레일러
          </Text>

          <View className="flex-row items-center" style={{ gap: scale(16) }}>
            <Pressable
              className="active:opacity-60"
              hitSlop={moderateScale(8)}
              // TODO(공유): 시스템 공유 시트 연결 — 이번 범위 밖.
              onPress={() => {}}
              accessibilityRole="button"
              accessibilityLabel="공유"
            >
              <ShareUpIcon
                width={moderateScale(20)}
                height={moderateScale(21)}
                color="#FFFFFF"
              />
            </Pressable>

            <Pressable
              className="active:opacity-60"
              hitSlop={moderateScale(8)}
              // TODO(영상 제작): 내 여행영상 만들기 플로우 진입 — 이번 범위 밖.
              onPress={() => {}}
              accessibilityRole="button"
              accessibilityLabel="내 여행영상 만들기"
            >
              <AddCircleIcon
                width={moderateScale(30)}
                height={moderateScale(30)}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        </View>

        {/* "내 여행영상 만들기" 말풍선 — 본체는 오른쪽에 붙이고,
            꼬리만 오른쪽 위로 뻗어 + 아이콘 중앙을 가리킨다. */}
        <View
          className="absolute items-end"
          style={{
            top: verticalScale(6) + moderateScale(30) + verticalScale(4),
            right: scale(TOOLTIP_RIGHT),
          }}
          pointerEvents="none"
        >
          {/* 꼬리(17 x 21): borderRight 0 인 직각삼각형이라 꼭짓점이 오른쪽 끝에
              생기고, 빗변이 왼쪽 아래로 기울어 위로 쭉 뻗는 모양이 된다.
              꼭짓점은 + 아이콘 중앙에서 TAIL_SHIFT 만큼 오른쪽. */}
          <View
            style={{
              width: 0,
              height: 0,
              marginRight:
                scale(20) +
                moderateScale(30) / 2 -
                scale(TOOLTIP_RIGHT) -
                scale(TAIL_SHIFT),
              marginBottom: -1, // 본체와의 이음새 제거
              borderLeftWidth: scale(TAIL_WIDTH),
              borderRightWidth: 0,
              borderBottomWidth: verticalScale(TAIL_HEIGHT),
              borderLeftColor: "transparent",
              borderBottomColor: TOOLTIP_COLOR,
            }}
          />
          <View
            className="items-center justify-center"
            style={{
              width: scale(TOOLTIP_WIDTH),
              height: verticalScale(TOOLTIP_HEIGHT),
              backgroundColor: TOOLTIP_COLOR,
              borderRadius: verticalScale(TOOLTIP_HEIGHT) / 2,
              elevation: 8,
              shadowColor: "#000",
            }}
          >
            <Text
              className="font-semibold text-white"
              numberOfLines={1}
              style={{ fontSize: moderateScale(12) }}
            >
              내 여행영상 만들기
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
