import { useIsFocused } from "@react-navigation/native";
import * as MediaLibrary from "expo-media-library";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Share,
  View,
  type LayoutChangeEvent,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { describeApiError } from "@/src/api/errors";
import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import CommentsSheet from "@/src/features/reels/components/CommentsSheet";
import ReelsCard from "@/src/features/reels/components/ReelsCard";
import { useToggleReelsLike } from "@/src/features/reels/queries";
import type { LikeResponse, Reels } from "@/src/features/reels/types";
import { useLikedReels, useMyReels } from "@/src/features/user/queries";
import type { MyReelsItem } from "@/src/features/user/types";
import {
  downloadMyReelsVideo,
  getReelsShareUrl,
} from "@/src/features/video/api";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

/** 목록 응답 → 피드 카드가 쓰는 Reels. 내 목록이라 작성자는 항상 나다. */
function toReels(item: MyReelsItem): Reels {
  return {
    reels_idx: item.reels_idx,
    author: {
      name: item.nickname ?? "알 수 없음",
      avatar_url: item.profile_image,
    },
    video_url: item.url,
    thumbnail_url: item.thumbnail_url,
    caption: item.title ?? "",
    location: item.region,
    like_count: item.like_count,
    liked: item.is_liked,
    comment_count: item.comment_count,
  };
}

/**
 * 내 영상 재생 — 그리드에서 고른 릴스부터 세로 스와이프로 본다.
 *
 * 피드 탭과 달리 전부 내 영상이라 공유 버튼은 항상 다운로드다.
 * 재생 방식(플레이어 1개 공유, 보이는 카드만 재생)은 피드와 동일하다 —
 * 카드마다 플레이어를 만들면 ExoPlayer 버퍼가 쌓여 힙이 터진다.
 */
export default function MyReelsPlayerScreen() {
  const { reels_idx, list } = useLocalSearchParams<{
    reels_idx?: string;
    list?: string;
  }>();
  const startIdx = reels_idx != null ? Number(reels_idx) : null;
  // list=liked 면 좋아요한 릴스(= 남의 영상일 수 있음), 없으면 내가 만든 릴스.
  const liked = list === "liked";
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const mineQuery = useMyReels(!liked);
  const likedQuery = useLikedReels(liked);
  const {
    data: reels = [],
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = liked ? likedQuery : mineQuery;

  // 좋아요는 목록 응답에 들어 있어(is_liked/like_count) 서버 확정값만 덧씌운다.
  const [likes, setLikes] = useState<Record<number, LikeResponse>>({});
  const toggleReelsLike = useToggleReelsLike();
  const toggleLike = useCallback(
    (reelsIdx: number) => {
      const item = reels.find((r) => r.reels_idx === reelsIdx);
      const before = likes[reelsIdx] ?? {
        liked: item?.is_liked ?? false,
        like_count: item?.like_count ?? 0,
      };
      setLikes((prev) => ({
        ...prev,
        [reelsIdx]: {
          liked: !before.liked,
          like_count: Math.max(0, before.like_count + (before.liked ? -1 : 1)),
        },
      }));
      toggleReelsLike.mutate(
        { reelsIdx, liked: before.liked },
        {
          onSuccess: (data) =>
            setLikes((prev) => ({ ...prev, [reelsIdx]: data })),
          onError: (err) => {
            setLikes((prev) => ({ ...prev, [reelsIdx]: before }));
            Alert.alert("좋아요 실패", describeApiError(err));
          },
        },
      );
    },
    [likes, reels, toggleReelsLike],
  );

  const [commentsFor, setCommentsFor] = useState<number | null>(null);

  // 내 영상이면 갤러리 저장, 좋아요한 남의 영상이면 공유 링크로 공유.
  const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null);
  const onShareOrDownload = useCallback(
    async (item: Reels) => {
      if (downloadingIdx != null) return;
      setDownloadingIdx(item.reels_idx);

      if (liked) {
        try {
          const shareUrl = await getReelsShareUrl(item.reels_idx);
          await Share.share({
            // 안드로이드는 url 필드를 무시하므로 message 에 넣어야 한다.
            message: `${item.caption ? `${item.caption}\n` : ""}${shareUrl}`,
          });
        } catch (err) {
          Alert.alert("공유할 수 없어요", describeApiError(err));
        } finally {
          setDownloadingIdx(null);
        }
        return;
      }

      try {
        // 저장 권한만 요청(writeOnly) — 읽기까지 요구할 이유가 없다.
        const permission = await MediaLibrary.requestPermissionsAsync(true);
        if (!permission.granted) {
          Alert.alert("권한 필요", "영상을 저장하려면 갤러리 권한이 필요해요.");
          return;
        }
        const uri = await downloadMyReelsVideo(item.reels_idx);
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert("저장 완료", "갤러리에 영상을 저장했어요.");
      } catch (err) {
        Alert.alert("다운로드 실패", describeApiError(err));
      } finally {
        setDownloadingIdx(null);
      }
    },
    [downloadingIdx, liked],
  );

  // 지금 화면을 채우고 있는 카드 = 재생할 카드.
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [visiblePosition, setVisiblePosition] = useState(0);
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const token = viewableItems[0];
      if (!token) return; // 전환 중 — 직전 상태 유지
      setActiveIdx((token.item as MyReelsItem).reels_idx);
      if (token.index != null) setVisiblePosition(token.index);
    },
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
  });

  const activeUrl = reels.find((r) => r.reels_idx === activeIdx)?.url ?? null;

  useEffect(() => {
    if (!activeUrl) return;
    void player.replaceAsync(activeUrl).catch(() => {
      // 개별 영상 로드 실패는 무시 — 다음 카드로 넘기면 복구된다.
    });
  }, [activeUrl, player]);

  useEffect(() => {
    if (isFocused && activeUrl) player.play();
    else player.pause();
  }, [isFocused, activeUrl, player]);

  // 끝에서 3장 남으면 다음 페이지를 미리 받는다.
  useEffect(() => {
    if (reels.length === 0) return;
    if (visiblePosition < reels.length - 3) return;
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [
    visiblePosition,
    reels.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // 카드 1장 = 뷰포트 1개. 탭바를 뺀 실제 높이를 재서 페이징 간격과 맞춘다.
  const [viewportHeight, setViewportHeight] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setViewportHeight(e.nativeEvent.layout.height);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: MyReelsItem }) => (
      <ReelsCard
        reels={{ ...toReels(item), ...likes[item.reels_idx] }}
        height={viewportHeight}
        active={isFocused && item.reels_idx === activeIdx}
        player={player}
        onToggleLike={toggleLike}
        onOpenComments={setCommentsFor}
        onShare={onShareOrDownload}
        mine={!liked}
        sharing={downloadingIdx === item.reels_idx}
      />
    ),
    [
      viewportHeight,
      likes,
      isFocused,
      activeIdx,
      player,
      toggleLike,
      onShareOrDownload,
      liked,
      downloadingIdx,
    ],
  );

  return (
    <View className="flex-1 bg-black" onLayout={onLayout}>
      <StatusBar style="light" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : isError ? (
        <View
          className="flex-1 items-center justify-center"
          style={{ paddingHorizontal: scale(24), gap: verticalScale(10) }}
        >
          <Text className="text-gray-300" style={{ fontSize: moderateScale(14) }}>
            내 영상을 불러오지 못했어요.
          </Text>
          <Text
            className="text-center text-gray-500"
            selectable
            style={{ fontSize: moderateScale(11) }}
          >
            {describeApiError(error)}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="rounded-full bg-neutral-700 active:opacity-70"
            style={{
              paddingHorizontal: scale(18),
              paddingVertical: verticalScale(8),
            }}
          >
            <Text
              className="font-semibold text-white"
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
          <Text className="text-gray-400" style={{ fontSize: moderateScale(14) }}>
            아직 만든 영상이 없어요.
          </Text>
          <Pressable
            onPress={() => router.push("/reels/create")}
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
              여행영상 만들기
            </Text>
          </Pressable>
        </View>
      ) : viewportHeight > 0 ? (
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
          // 그리드에서 고른 릴스부터 시작(없으면 처음부터). getItemLayout 이 있어 바로 점프된다.
          initialScrollIndex={Math.max(
            0,
            reels.findIndex((r) => r.reels_idx === startIdx),
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      ) : null}

      {/* 뒤로가기 — 영상 위라 헤더는 최소한만 */}
      <View
        className="absolute flex-row items-center"
        style={{
          top: insets.top + verticalScale(8),
          left: scale(16),
          gap: scale(10),
        }}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <BackIcon
            color="#FFFFFF"
            width={moderateScale(20)}
            height={moderateScale(20)}
          />
        </Pressable>
        <Text
          className="font-semibold text-white"
          style={{ fontSize: moderateScale(16) }}
        >
          내 영상
        </Text>
      </View>

      <CommentsSheet
        reelsIdx={commentsFor}
        onClose={() => setCommentsFor(null)}
      />
    </View>
  );
}
