import { Image } from "expo-image";
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

/**
 * "내 여행영상 만들기" 말풍선 — 꼬리·글씨까지 포함된 이미지 에셋.
 * (Metro 는 대소문자를 구분하므로 실제 파일명과 정확히 일치시킬 것)
 *
 * 원본 432 x 172 중 본체(알약)가 432 x 120, 꼬리 꼭짓점은 오른쪽 끝에서 54.5px.
 * 0.25 배로 렌더하면 본체가 정확히 108 x 30 이 된다.
 */
const TOOLTIP_IMG = require("../../../assets/images/style/message.png");
const TOOLTIP_W = 108; // 432 * 0.25 — 본체 폭과 동일
const TOOLTIP_H = 43; // 172 * 0.25 — 꼬리 포함 전체 높이
const TAIL_APEX_FROM_RIGHT = 13.6; // 54.5 * 0.25 — 이미지 우측 끝 ~ 꼬리 꼭짓점

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

        {/* "내 여행영상 만들기" 말풍선 (이미지). 꼬리 꼭짓점이 + 아이콘 중앙에 오도록
            이미지 우측 여백(TAIL_APEX_FROM_RIGHT)만큼 되밀어 배치한다. */}
        <Image
          source={TOOLTIP_IMG}
          contentFit="contain"
          pointerEvents="none"
          style={{
            position: "absolute",
            top: verticalScale(6) + moderateScale(30) + verticalScale(4),
            right:
              scale(20) + moderateScale(30) / 2 - scale(TAIL_APEX_FROM_RIGHT),
            width: scale(TOOLTIP_W),
            height: scale(TOOLTIP_H), // 가로세로 같은 배율 — 비율 왜곡 방지
          }}
        />
      </View>
    </View>
  );
}
