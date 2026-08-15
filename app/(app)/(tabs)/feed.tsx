import { useIsFocused } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useConfirmDialog } from "@/src/components/ConfirmDialog";
import AddCircleIcon from "@/src/components/icons/AddCircleIcon";
import ShareUpIcon from "@/src/components/icons/ShareUpIcon";
import { Text } from "@/src/components/Text";
import CommentsSheet from "@/src/features/reels/components/CommentsSheet";
import ReelsCard from "@/src/features/reels/components/ReelsCard";
import ReportBlockSheet from "@/src/features/reels/components/ReportBlockSheet";
import { reelsKeys } from "@/src/features/reels/keys";
import {
  HOME_PREVIEW_LIMIT,
  useRecommendedReels,
  useToggleReelsLike,
} from "@/src/features/reels/queries";
import type { LikeResponse, Reels } from "@/src/features/reels/types";
import {
  useBlockUser,
  useMyProfile,
  useReportUser,
} from "@/src/features/user/queries";
import {
  downloadMyReelsVideo,
  getReelsShareUrl,
} from "@/src/features/video/api";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

// "내 여행영상 만들기" 말풍선 — 메인탭 말풍선과 동일한 CSS 텍스트 버블(색·굵기 통일).
const TOOLTIP_COLOR = "#5E84F4";

export default function FeedTab() {
  const insets = useSafeAreaInsets();
  const {
    data: recommended = [],
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRecommendedReels();

  // 홈 '지금 사람들이 떠나는 여행' 카드로 들어온 경우 그 릴스를 맨 앞에 세운다.
  // 실물 데이터는 홈이 이미 받아 둔 preview 캐시에서 꺼내므로 추가 요청이 없다.
  const { reelsIdx: fromHome } = useLocalSearchParams<{ reelsIdx?: string }>();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<Reels>>(null);
  const [pinned, setPinned] = useState<Reels | null>(null);
  useEffect(() => {
    if (!fromHome) return;
    const preview = queryClient.getQueryData<Reels[]>(
      reelsKeys.preview(HOME_PREVIEW_LIMIT),
    );
    // 캐시가 비었으면(앱 재시작 후 딥링크 등) 그냥 평소 추천 목록으로 둔다.
    setPinned(preview?.find((r) => String(r.reels_idx) === fromHome) ?? null);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    // 파라미터는 한 번만 소비한다 — 남겨 두면 탭바로 다시 들어올 때마다 맨 앞으로 튄다.
    router.setParams({ reelsIdx: "" });
  }, [fromHome, queryClient]);

  const reels = useMemo(
    () =>
      pinned
        ? [pinned, ...recommended.filter((r) => r.reels_idx !== pinned.reels_idx)]
        : recommended,
    [pinned, recommended],
  );

  // 다른 탭으로 가면 소리까지 멈추도록 — 포커스가 없으면 재생 중인 카드도 없다.
  const isFocused = useIsFocused();

  // 하트의 초기 상태·개수는 추천 응답(is_liked / like_count)이 준다.
  // 누른 뒤의 서버 확정값만 여기에 모아 카드에 덮어쓴다 — 목록 캐시를 고치면
  // 스크롤 중 순서·구성이 흔들린다.
  const [likes, setLikes] = useState<Record<number, LikeResponse>>({});
  const toggleReelsLike = useToggleReelsLike();
  const toggleLike = useCallback(
    (reelsIdx: number) => {
      const item = reels.find((r) => r.reels_idx === reelsIdx);
      const before = likes[reelsIdx] ?? {
        liked: item?.liked ?? false,
        like_count: item?.like_count ?? 0,
      };
      // 하트는 즉시 반응해야 하므로 먼저 뒤집고, 실패하면 되돌린다.
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

  // 댓글 시트를 연 릴스. null 이면 닫힘.
  const [commentsFor, setCommentsFor] = useState<number | null>(null);

  // ⋯ 메뉴를 연 릴스. 신고는 신고 API, 차단은 차단 API 로 각각 나간다.
  const [moreFor, setMoreFor] = useState<Reels | null>(null);
  const block = useBlockUser();
  const report = useReportUser();
  // 신고·차단 확인/결과는 OS 기본 Alert 대신 앱 UI 다이얼로그로 띄운다.
  const { dialog, ask, notify } = useConfirmDialog();

  const blockAuthor = useCallback(
    (target: Reels, reason: "report" | "block") => {
      setMoreFor(null);
      const userIdx = target.author.user_idx;
      if (userIdx == null) {
        // 추천 API 응답에 작성자 PK 가 없으면 차단 대상을 특정할 수 없다.
        notify({
          title: "처리할 수 없어요",
          message: "작성자 정보를 받지 못했어요. 잠시 후 다시 시도해 주세요.",
        });
        return;
      }
      ask({
        title:
          reason === "report"
            ? `${target.author.name}님의 릴스를 신고할까요?`
            : `${target.author.name}님을 차단할까요?`,
        message:
          reason === "report"
            ? "관리자에게 신고가 접수되고, 이 사용자의 릴스와 댓글이 나에게만 보이지 않아요."
            : "차단하면 이 사용자의 릴스와 댓글이 나에게만 보이지 않아요.",
        confirmLabel: reason === "report" ? "신고하기" : "차단하기",
        danger: true,
        onConfirm: () =>
          (reason === "report" ? report : block).mutate(userIdx, {
            onSuccess: () =>
              notify({
                title: reason === "report" ? "신고했어요" : "차단했어요",
                message: "이 사용자의 릴스와 댓글이 더 이상 보이지 않아요.",
              }),
            onError: (err) =>
              notify({
                title: reason === "report" ? "신고 실패" : "차단 실패",
                message: describeApiError(err),
              }),
          }),
      });
    },
    [block, report, ask, notify],
  );

  // 공유/다운로드 —
  // 추천 API 가 작성자 user_idx 를 주지 않아 내 영상 판별은 닉네임 비교로 한다.
  // (닉네임이 겹치면 오판할 수 있지만, 다운로드 API 가 남의 릴스에 404 를 주므로 서버가 최종 방어)
  const { data: me } = useMyProfile();
  const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null);

  const isMyReels = useCallback(
    (reels: Reels) => !!me?.nickname && me.nickname === reels.author.name,
    [me?.nickname],
  );

  const onShare = useCallback(
    async (reels: Reels) => {
      const isMine = isMyReels(reels);

      if (downloadingIdx != null) return;
      setDownloadingIdx(reels.reels_idx);

      if (!isMine) {
        try {
          // 버킷 영상 주소 대신 공유 페이지 링크 — 카톡·SNS 에서 미리보기가 뜬다.
          const shareUrl = await getReelsShareUrl(reels.reels_idx);
          await Share.share({
            // 안드로이드는 url 필드를 무시하므로 message 에 넣어야 한다.
            message: `${reels.caption ? `${reels.caption}\n` : ""}${shareUrl}`,
          });
        } catch (err) {
          // 404 = 삭제됐거나 아직 렌더 중.
          Alert.alert("공유할 수 없어요", describeApiError(err));
        } finally {
          setDownloadingIdx(null);
        }
        return;
      }

      try {
        // 갤러리 저장 권한만 요청(writeOnly) — 읽기까지 요구할 이유가 없다.
        const permission = await MediaLibrary.requestPermissionsAsync(true);
        if (!permission.granted) {
          Alert.alert("권한 필요", "영상을 저장하려면 갤러리 권한이 필요해요.");
          return;
        }
        const uri = await downloadMyReelsVideo(reels.reels_idx);
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert("저장 완료", "갤러리에 영상을 저장했어요.");
      } catch (err) {
        Alert.alert("다운로드 실패", describeApiError(err));
      } finally {
        setDownloadingIdx(null);
      }
    },
    [isMyReels, downloadingIdx],
  );

  // 지금 화면을 채우고 있는 카드의 위치 = 재생할 카드.
  // 한 바퀴 돌면 같은 릴스가 다시 오므로 reels_idx 가 아니라 인덱스로 판정한다.
  const [visiblePosition, setVisiblePosition] = useState(0);
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const token = viewableItems[0];
      if (!token) return; // 카드 전환 중 — 직전 상태를 유지해 재생이 끊기지 않게 한다
      if (token.index != null) setVisiblePosition(token.index);
    },
  ).current;
  // 카드가 화면 대부분을 덮었을 때만 "보이는" 것으로 친다(전환 중 두 장 동시 재생 방지).
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  // 플레이어는 피드 전체에서 1개만. 카드마다 만들면 ExoPlayer 버퍼가 쌓여 힙(192MB)이 터진다.
  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
  });

  const activeUrl = reels[visiblePosition]?.video_url ?? null;

  // 보이는 카드가 바뀌면 소스만 갈아끼운다(플레이어 재생성 없음).
  useEffect(() => {
    if (!activeUrl) return;
    void player.replaceAsync(activeUrl).catch(() => {
      // 개별 영상 로드 실패는 무시 — 다음 카드로 넘기면 복구된다.
    });
  }, [activeUrl, player]);

  // 탭을 벗어나거나 볼 카드가 없으면 정지.
  useEffect(() => {
    if (isFocused && activeUrl) player.play();
    else player.pause();
  }, [isFocused, activeUrl, player]);

  // 끝에서 3장 남으면 다음 10개를 미리 받는다(이미 받은 reels_idx 는 exclude 로 제외됨).
  // onEndReached 는 pagingEnabled 와 함께 쓰면 마지막 카드에 닿아서야 늦게 불린다.
  useEffect(() => {
    if (reels.length === 0) return;
    if (visiblePosition < reels.length - 3) return;
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [visiblePosition, reels.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 카드 1장 = 뷰포트 1개. 탭바를 제외한 실제 높이를 onLayout 으로 재서
  // 페이징 간격과 카드 높이를 항상 일치시킨다(기기별 탭바/내비바 높이 차이 흡수).
  const [viewportHeight, setViewportHeight] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setViewportHeight(e.nativeEvent.layout.height);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Reels; index: number }) => (
      <ReelsCard
        reels={{ ...item, ...likes[item.reels_idx] }}
        height={viewportHeight}
        active={isFocused && index === visiblePosition}
        player={player}
        onToggleLike={toggleLike}
        onOpenComments={setCommentsFor}
        onShare={onShare}
        onOpenMore={setMoreFor}
        mine={isMyReels(item)}
        sharing={downloadingIdx === item.reels_idx}
      />
    ),
    [
      viewportHeight,
      toggleLike,
      likes,
      visiblePosition,
      isFocused,
      player,
      onShare,
      isMyReels,
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
      ) : viewportHeight > 0 ? (
        <FlatList
          ref={listRef}
          data={reels}
          // 한 바퀴 돌면 같은 reels_idx 가 다시 들어오므로 위치까지 붙여 유일하게 만든다.
          keyExtractor={(item, index) => `${item.reels_idx}-${index}`}
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
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
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
            className="text-white"
            style={{ fontSize: moderateScale(20), fontWeight: 650 as never }}
          >
            트레일러
          </Text>

          <View className="flex-row items-center" style={{ gap: scale(16) }}>
            <Pressable
              className="active:opacity-60"
              hitSlop={moderateScale(8)}
              onPress={() => router.push("/reels/upload")}
              accessibilityRole="button"
              accessibilityLabel="영상 업로드"
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

      <CommentsSheet
        reelsIdx={commentsFor}
        onClose={() => setCommentsFor(null)}
      />

      <ReportBlockSheet
        visible={moreFor != null}
        name={moreFor?.author.name ?? "영상"}
        reportLabel="이 릴스 신고하기"
        onClose={() => setMoreFor(null)}
        onReport={() => moreFor && blockAuthor(moreFor, "report")}
        onBlock={() => moreFor && blockAuthor(moreFor, "block")}
      />

      {dialog}
    </View>
  );
}
