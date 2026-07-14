import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { FlatList, Pressable, View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AddCircleIcon from "@/src/components/icons/AddCircleIcon";
import ShareIcon from "@/src/components/icons/ShareIcon";
import { Text } from "@/src/components/Text";
import ReelsCard from "@/src/features/reels/components/ReelsCard";
import { useReelsStore } from "@/src/features/reels/store";
import type { Reels } from "@/src/features/reels/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

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

      {/* 상단 헤더 — 릴스 위에 떠 있는 오버레이 */}
      <View
        className="absolute inset-x-0 top-0 flex-row items-start justify-between"
        style={{
          paddingTop: insets.top + verticalScale(8),
          paddingHorizontal: scale(16),
        }}
      >
        <Text
          className="text-white"
          style={{ fontSize: moderateScale(20), fontWeight: "700" }}
        >
          트레일러
        </Text>

        <View className="flex-row items-center" style={{ gap: scale(12) }}>
          <Pressable
            className="active:opacity-60"
            hitSlop={moderateScale(8)}
            // TODO(공유): 시스템 공유 시트 연결 — 이번 범위 밖.
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="공유"
          >
            <ShareIcon
              width={moderateScale(24)}
              height={moderateScale(24)}
              color="#FFFFFF"
            />
          </Pressable>

          <View className="items-center" style={{ gap: verticalScale(4) }}>
            <Pressable
              className="active:opacity-60"
              hitSlop={moderateScale(8)}
              // TODO(영상 제작): 내 여행영상 만들기 플로우 진입 — 이번 범위 밖.
              onPress={() => {}}
              accessibilityRole="button"
              accessibilityLabel="내 여행영상 만들기"
            >
              <AddCircleIcon
                width={moderateScale(26)}
                height={moderateScale(26)}
                color="#FFFFFF"
              />
            </Pressable>
            <View
              className="rounded-full bg-white/20"
              style={{
                paddingHorizontal: scale(8),
                paddingVertical: verticalScale(3),
              }}
            >
              <Text
                className="text-white"
                style={{ fontSize: moderateScale(10) }}
              >
                내 여행영상 만들기
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
