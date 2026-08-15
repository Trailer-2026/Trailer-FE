import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { describeApiError } from "@/src/api/errors";
import BackIcon from "@/src/components/icons/BackIcon";
import PlaceMarkerIcon from "@/src/components/icons/PlaceMarkerIcon";
import { Text } from "@/src/components/Text";
import { useToggleReelsLike } from "@/src/features/reels/queries";
import { useLikedReels } from "@/src/features/user/queries";
import type { MyReelsItem } from "@/src/features/user/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

/* Figma '북마크'(360x800) 시안 기준 수치 — 카드 122x81, X 버튼 19, 좌측 여백 21.
   (시안 이름은 북마크지만 실제 내용은 좋아요한 영상이라 화면 문구는 그쪽으로 맞췄다.) */
const TEXT_DARK = "#353535";
const TEXT_MUTED = "#656565";
const PIN_GRAY = "#666666";
const CARD_BG = "#F5F5F7";
const XBTN_BG = "#C5C5C5";

const CARD_W = scale(122);
const CARD_H = verticalScale(81);
/** 카드 안에 세로 영상 썸네일을 가운데로 놓는다(디자인은 55x81). */
const THUMB_W = scale(55);
const XBTN = scale(19);
const ROW_GAP = verticalScale(14);

/**
 * 좋아요한 영상 — 내가 하트를 누른 릴스 목록(가로 한 줄 카드).
 *
 * GET /api/users/me/reels/liked. 별도 북마크 기능이 없어 좋아요가 곧 저장이라,
 * 화면 이름도 실제 동작대로 '좋아요한 영상'으로 부른다(라우트만 bookmarks 로 남음).
 * 좌측 X 는 좋아요 취소 — 성공하면 목록이 무효화돼 그 줄이 사라진다.
 * 줄을 누르면 그 릴스부터 세로 스와이프 재생(reels-player, list=liked).
 */
export default function BookmarksScreen() {
  const {
    data: reels = [],
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLikedReels();

  const toggleLike = useToggleReelsLike();
  // 취소 요청 중인 릴스 — 그 줄만 흐리게 하고 중복 탭을 막는다.
  const [removing, setRemoving] = useState<number | null>(null);

  const unlike = (item: MyReelsItem) => {
    if (removing != null) return;
    setRemoving(item.reels_idx);
    toggleLike.mutate(
      // 목록에 있다 = 이미 좋아요 상태 → liked:true 로 보내면 취소된다.
      { reelsIdx: item.reels_idx, liked: true },
      {
        onError: (err) => Alert.alert("취소 실패", describeApiError(err)),
        onSettled: () => setRemoving(null),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="dark" />

      {/* 헤더 — 뒤로 + '좋아요한 영상' */}
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: scale(21),
          paddingTop: verticalScale(14),
          paddingBottom: verticalScale(10),
          gap: scale(14),
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <BackIcon
            color={TEXT_DARK}
            width={moderateScale(9)}
            height={moderateScale(15)}
          />
        </Pressable>
        <Text
          style={{
            color: TEXT_DARK,
            fontSize: moderateScale(16),
            fontWeight: "700",
          }}
        >
          좋아요한 영상
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#9CA3AF" />
        </View>
      ) : isError ? (
        <View
          className="flex-1 items-center justify-center"
          style={{ paddingHorizontal: scale(24), gap: verticalScale(10) }}
        >
          <Text style={{ color: TEXT_DARK, fontSize: moderateScale(14) }}>
            좋아요한 영상을 불러오지 못했어요.
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
            좋아요한 영상이 없어요. 피드에서 하트를 눌러보세요.
          </Text>
          <Pressable
            onPress={() => router.push("/feed")}
            className="rounded-full active:opacity-80"
            style={{
              backgroundColor: "#5E84F4",
              paddingHorizontal: scale(20),
              paddingVertical: verticalScale(10),
            }}
          >
            <Text
              className="font-semibold text-white"
              style={{ fontSize: moderateScale(13) }}
            >
              릴스 보러가기
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => String(item.reels_idx)}
          contentContainerStyle={{
            paddingBottom: verticalScale(24),
            gap: ROW_GAP,
          }}
          ListHeaderComponent={
            <Text
              style={{
                paddingHorizontal: scale(21),
                marginTop: verticalScale(10),
                marginBottom: verticalScale(14),
                color: TEXT_DARK,
                fontSize: moderateScale(14),
                fontWeight: "700",
              }}
            >
              {/* 로드된 개수 — 다음 페이지가 남았으면 '+' 로 더 있음을 표시 */}
              좋아요한 영상 {reels.length}
              {hasNextPage ? "+" : ""}
            </Text>
          }
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
            <BookmarkRow
              item={item}
              removing={removing === item.reels_idx}
              onPress={() =>
                router.push(
                  `/profile/reels-player?reels_idx=${item.reels_idx}&list=liked`,
                )
              }
              onRemove={() => unlike(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

/** X(좋아요 취소) + 썸네일 카드 + 제목·수치·지역 한 줄. */
function BookmarkRow({
  item,
  removing,
  onPress,
  onRemove,
}: {
  item: MyReelsItem;
  removing: boolean;
  onPress: () => void;
  onRemove: () => void;
}) {
  return (
    <View
      className="flex-row items-center"
      style={{ paddingHorizontal: scale(21), opacity: removing ? 0.5 : 1 }}
    >
      {/* 좋아요 취소 */}
      <Pressable
        onPress={onRemove}
        disabled={removing}
        hitSlop={10}
        className="items-center justify-center rounded-full active:opacity-70"
        style={{ width: XBTN, height: XBTN, backgroundColor: XBTN_BG }}
        accessibilityRole="button"
        accessibilityLabel={`${item.title ?? "영상"} 좋아요 취소`}
      >
        {removing ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <XMark size={scale(8)} />
        )}
      </Pressable>

      <Pressable
        onPress={onPress}
        disabled={removing}
        className="flex-1 flex-row items-center active:opacity-80"
        style={{ marginLeft: scale(10) }}
      >
        {/* 썸네일 카드 — 회색 판 위에 세로 영상 프레임을 가운데로 */}
        <View
          className="items-center justify-center overflow-hidden"
          style={{
            width: CARD_W,
            height: CARD_H,
            borderRadius: scale(4),
            backgroundColor: CARD_BG,
          }}
        >
          {item.thumbnail_url ? (
            <Image
              source={{ uri: item.thumbnail_url }}
              style={{ width: THUMB_W, height: "100%" }}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View
              className="items-center justify-center bg-gray-300"
              style={{ width: THUMB_W, height: "100%" }}
            >
              <Text className="text-white" style={{ fontSize: moderateScale(12) }}>
                ▶
              </Text>
            </View>
          )}
        </View>

        {/* 제목 · 수치 · 지역 */}
        <View className="flex-1" style={{ marginLeft: scale(10) }}>
          <Text
            numberOfLines={1}
            style={{
              color: TEXT_DARK,
              fontSize: moderateScale(14),
              fontWeight: "600",
            }}
          >
            {item.title ?? "제목 없는 영상"}
          </Text>
          {/* 디자인의 '조회수 · 경과시간'은 API 에 없어 좋아요·댓글 수로 대체 */}
          <Text
            numberOfLines={1}
            style={{
              color: TEXT_MUTED,
              fontSize: moderateScale(12),
              fontWeight: "500",
              marginTop: verticalScale(4),
            }}
          >
            좋아요 {item.like_count}회 ∙ 댓글 {item.comment_count}
          </Text>

          {item.region ? (
            <View
              className="flex-row items-center"
              style={{ marginTop: verticalScale(23), gap: scale(4) }}
            >
              <PlaceMarkerIcon
                width={moderateScale(8)}
                height={moderateScale(10)}
                color={PIN_GRAY}
                dotFill="#FFFFFF"
              />
              <Text
                numberOfLines={1}
                style={{
                  color: PIN_GRAY,
                  fontSize: moderateScale(12),
                  fontWeight: "500",
                }}
              >
                {item.region}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

/** 원 안의 흰 X — 전용 아이콘이 없어 선 두 개를 겹쳐 그린다. */
function XMark({ size }: { size: number }) {
  const bar = { position: "absolute" as const, width: size, height: 1.5, backgroundColor: "#FFFFFF" };
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <View style={[bar, { transform: [{ rotate: "45deg" }] }]} />
      <View style={[bar, { transform: [{ rotate: "-45deg" }] }]} />
    </View>
  );
}
