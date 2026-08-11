import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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

// "내 여행영상 만들기" 말풍선 — 메인탭 말풍선과 동일한 CSS 텍스트 버블(색·굵기 통일).
const TOOLTIP_COLOR = "#5E84F4";

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
            // 앱 전체 상단바와 같은 높이로 맞추기 위한 여백.
            marginTop: verticalScale(6),
            height: verticalScale(44),
          }}
        >
          <Text
            className="font-bold text-white"
            style={{ fontSize: moderateScale(20) }}
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
              onPress={() => router.push("/reels/create")}
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

        {/* "내 여행영상 만들기" 말풍선 (CSS) — + 아이콘 바로 밑, 꼬리가 + 아래를 가리킴 */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: verticalScale(6) + moderateScale(30) + verticalScale(4),
            right: scale(20),
            alignItems: "flex-end",
            zIndex: 10,
          }}
        >
          {/* 꼬리 (위로 향하는 삼각형) — + 아이콘 중앙 아래 */}
          <View
            style={{
              width: 0,
              height: 0,
              marginRight: moderateScale(15) - scale(6),
              // 둥근 말풍선 모서리와 맞닿는 부분이 뜨지 않게 살짝 겹치도록 아래로 더 뺀다
              marginBottom: -verticalScale(3),
              borderLeftWidth: scale(6),
              borderRightWidth: scale(6),
              borderBottomWidth: verticalScale(16),
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: TOOLTIP_COLOR,
            }}
          />
          {/* 말풍선 본체 */}
          <View
            style={{
              width: scale(100), // 메인탭 말풍선(TOOLTIP_W)과 동일 크기
              height: verticalScale(30),
              backgroundColor: TOOLTIP_COLOR,
              borderRadius: scale(14),
              alignItems: "center",
              justifyContent: "center",
              elevation: 8,
              shadowColor: "#000",
            }}
          >
            <Text
              className="text-white font-semibold"
              numberOfLines={1}
              style={{ fontSize: moderateScale(12) }}
            >
              여행영상 만들기
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
