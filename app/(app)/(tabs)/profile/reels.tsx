import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { describeApiError } from "@/src/api/errors";
import BackIcon from "@/src/components/icons/BackIcon";
import PlaceMarkerIcon from "@/src/components/icons/PlaceMarkerIcon";
import { Text } from "@/src/components/Text";
import { useMyReels } from "@/src/features/user/queries";
import type { MyReelsItem } from "@/src/features/user/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";
const COLS = 3;
const GAP = 2;

/**
 * 내 영상 — 인스타 프로필처럼 썸네일 3열 그리드.
 *
 * 칸을 누르면 그 릴스부터 세로 스와이프 재생(reels-player), 우상단 ⋯ 은 바로 편집(studio).
 * 썸네일이 없는(옛 릴스·추출 실패) 항목은 어두운 자리표시자로 둔다 — 영상 첫 프레임을
 * 뽑으려면 별도 라이브러리가 필요해 그리드에서는 재생하지 않는다.
 */
export default function MyReelsGridScreen() {
  const { width } = useWindowDimensions();
  const cell = (width - GAP * (COLS - 1)) / COLS;

  const {
    data: reels = [],
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyReels();

  // ⋯ 로 연 항목 (null 이면 닫힘)
  const [menuFor, setMenuFor] = useState<MyReelsItem | null>(null);

  const openPlayer = (item: MyReelsItem) =>
    router.push(`/profile/reels-player?reels_idx=${item.reels_idx}`);

  const openStudio = (item: MyReelsItem) => {
    setMenuFor(null);
    router.push(
      `/reels/studio?reels_idx=${item.reels_idx}&url=${encodeURIComponent(item.url)}`,
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: scale(16),
          paddingVertical: verticalScale(12),
          gap: scale(12),
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <BackIcon
            color="#111827"
            width={moderateScale(20)}
            height={moderateScale(20)}
          />
        </Pressable>
        <Text
          className="font-semibold text-gray-900"
          style={{ fontSize: moderateScale(16) }}
        >
          내 영상
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : isError ? (
        <View
          className="flex-1 items-center justify-center"
          style={{ paddingHorizontal: scale(24), gap: verticalScale(10) }}
        >
          <Text className="text-gray-700" style={{ fontSize: moderateScale(14) }}>
            내 영상을 불러오지 못했어요.
          </Text>
          <Text
            className="text-center text-gray-400"
            selectable
            style={{ fontSize: moderateScale(11) }}
          >
            {describeApiError(error)}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="rounded-full bg-gray-200 active:opacity-70"
            style={{
              paddingHorizontal: scale(18),
              paddingVertical: verticalScale(8),
            }}
          >
            <Text
              className="font-semibold text-gray-800"
              style={{ fontSize: moderateScale(12) }}
            >
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : reels.length === 0 ? (
        <View
          className="flex-1 items-center justify-center"
          style={{ gap: verticalScale(12) }}
        >
          <Text className="text-gray-500" style={{ fontSize: moderateScale(14) }}>
            아직 만든 영상이 없어요.
          </Text>
          <Pressable
            onPress={() => router.push("/reels/create")}
            className="rounded-full active:opacity-80"
            style={{
              backgroundColor: ACCENT,
              paddingHorizontal: scale(20),
              paddingVertical: verticalScale(10),
            }}
          >
            <Text
              className="font-semibold text-white"
              style={{ fontSize: moderateScale(13) }}
            >
              여행영상 만들기
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => String(item.reels_idx)}
          numColumns={COLS}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ gap: GAP, paddingBottom: verticalScale(24) }}
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: verticalScale(16) }}>
                <ActivityIndicator color="#9CA3AF" />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <GridCell
              item={item}
              size={cell}
              onPress={() => openPlayer(item)}
              onMenu={() => setMenuFor(item)}
            />
          )}
        />
      )}

      <ItemMenu
        item={menuFor}
        onClose={() => setMenuFor(null)}
        onEdit={openStudio}
      />
    </SafeAreaView>
  );
}

/** 그리드 한 칸 — 썸네일(세로 4:5 비율) + 우상단 ⋯ + 좌하단 제목/지역. */
function GridCell({
  item,
  size,
  onPress,
  onMenu,
}: {
  item: MyReelsItem;
  size: number;
  onPress: () => void;
  onMenu: () => void;
}) {
  // 세로(9:16) 영상이라 칸도 세로로 길게. 1.5 면 3열에서도 화면이 답답하지 않다.
  const height = size * 1.5;

  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-80"
      style={{ width: size, height }}
    >
      {item.thumbnail_url ? (
        <Image
          source={{ uri: item.thumbnail_url }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View className="h-full w-full items-center justify-center bg-gray-200">
          <Text className="text-gray-400" style={{ fontSize: moderateScale(14) }}>
            ▶
          </Text>
        </View>
      )}

      {/* ⋯ — 누르면 편집 메뉴. 칸 탭(재생)과 겹치지 않게 눌리는 영역을 분리한다. */}
      <Pressable
        onPress={onMenu}
        hitSlop={10}
        className="absolute items-center justify-center"
        style={{
          top: scale(4),
          right: scale(4),
          width: scale(24),
          height: scale(24),
          borderRadius: scale(12),
          backgroundColor: "rgba(0,0,0,0.45)",
        }}
        accessibilityRole="button"
        accessibilityLabel={`${item.title ?? "영상"} 더보기`}
      >
        <Text
          className="font-bold text-white"
          style={{ fontSize: moderateScale(13) }}
        >
          ⋯
        </Text>
      </Pressable>

      {/* 지역 — 좌상단 핀 배지(API 규격) */}
      {item.region ? (
        <View
          className="absolute flex-row items-center"
          pointerEvents="none"
          style={{
            top: scale(4),
            left: scale(4),
            backgroundColor: "rgba(0,0,0,0.55)",
            borderRadius: scale(10),
            paddingHorizontal: scale(6),
            paddingVertical: verticalScale(2),
            gap: scale(2),
          }}
        >
          <PlaceMarkerIcon
            width={moderateScale(7)}
            height={moderateScale(9)}
            color="#FFFFFF"
            dotFill="rgba(0,0,0,0.55)"
          />
          <Text
            className="font-semibold text-white"
            numberOfLines={1}
            style={{ fontSize: moderateScale(9) }}
          >
            {item.region}
          </Text>
        </View>
      ) : null}

      {/* 제목 — 하단 그라데이션 띠. 지역과 겹치지 않게 위치를 분리한다. */}
      {item.title ? (
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.75)"]}
          className="absolute inset-x-0 bottom-0"
          pointerEvents="none"
          style={{
            paddingHorizontal: scale(6),
            paddingTop: verticalScale(14),
            paddingBottom: verticalScale(5),
          }}
        >
          <Text
            className="font-medium text-white"
            numberOfLines={2}
            style={{ fontSize: moderateScale(10), lineHeight: moderateScale(13) }}
          >
            {item.title}
          </Text>
        </LinearGradient>
      ) : null}
    </Pressable>
  );
}

/** ⋯ 메뉴 — 지금은 편집 하나뿐이라 시트 한 줄로 끝낸다. */
function ItemMenu({
  item,
  onClose,
  onEdit,
}: {
  item: MyReelsItem | null;
  onClose: () => void;
  onEdit: (item: MyReelsItem) => void;
}) {
  return (
    <Modal
      visible={item != null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: scale(16),
            borderTopRightRadius: scale(16),
            paddingVertical: verticalScale(8),
          }}
        >
          <View
            style={{
              paddingHorizontal: scale(20),
              paddingTop: verticalScale(8),
              paddingBottom: verticalScale(4),
            }}
          >
            <Text
              className="text-gray-400"
              numberOfLines={1}
              style={{ fontSize: moderateScale(11) }}
            >
              {item?.title ?? "제목 없는 영상"}
            </Text>
          </View>

          <MenuRow
            label="영상 편집"
            onPress={() => item && onEdit(item)}
          />
          <MenuRow label="닫기" muted onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MenuRow({
  label,
  muted = false,
  onPress,
}: {
  label: string;
  muted?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-60"
      style={{
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(14),
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        className={muted ? "text-gray-400" : "font-semibold text-gray-900"}
        style={{ fontSize: moderateScale(14) }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
