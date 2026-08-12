import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, type VideoPlayer } from "expo-video";
import { ActivityIndicator, Pressable, View } from "react-native";

import CommentIcon from "@/src/components/icons/CommentIcon";
import DownloadIcon from "@/src/components/icons/DownloadIcon";
import HeartIcon from "@/src/components/icons/HeartIcon";
import PlaceMarkerIcon from "@/src/components/icons/PlaceMarkerIcon";
import ShareIcon from "@/src/components/icons/ShareIcon";
import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import type { Reels } from "../types";

type Props = {
  reels: Reels;
  /** 한 카드가 차지할 높이(= 뷰포트 높이). 페이징 단위와 반드시 같아야 한다. */
  height: number;
  /** 지금 화면에 보이는 카드인지 — 이 카드만 플레이어를 붙인다. */
  active: boolean;
  /** 피드 전체가 공유하는 플레이어 1개. 카드마다 만들면 ExoPlayer 버퍼가 쌓여 OOM 난다. */
  player: VideoPlayer;
  onToggleLike: (reelsIdx: number) => void;
  onOpenComments: (reelsIdx: number) => void;
  /** 내 영상이면 다운로드, 남의 영상이면 링크 공유 — 분기는 호출부(feed)가 한다. */
  onShare: (reels: Reels) => void;
  /** ⋯ — 신고·차단 메뉴. 없으면 ⋯ 버튼을 그리지 않는다(내 영상 재생 화면). */
  onOpenMore?: (reels: Reels) => void;
  /** 내 영상 — 버튼을 공유 대신 다운로드 아이콘으로 바꾼다. */
  mine?: boolean;
  /** 다운로드·링크 조회 진행 중 — 버튼을 스피너로 바꾸고 중복 탭을 막는다. */
  sharing?: boolean;
};

/**
 * 액션바 아이콘 크기 — Figma 원본 치수(비율 유지)에 공통 배율을 곱한다.
 * 세 아이콘을 한꺼번에 키우거나 줄이려면 ICON_SCALE 만 조정하면 된다.
 */
const ICON_SCALE = 1.15;
const ICON = {
  heart: { w: 24 * ICON_SCALE, h: 21 * ICON_SCALE },
  comment: { w: 23 * ICON_SCALE, h: 23 * ICON_SCALE },
  share: { w: 27 * ICON_SCALE, h: 28 * ICON_SCALE },
};

/** 1000 이상은 "1.2천"으로 축약 — 액션바 폭이 좁아 자릿수를 제한한다. */
function formatCount(n: number) {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}천`;
}

export default function ReelsCard({
  reels,
  height,
  active,
  player,
  onToggleLike,
  onOpenComments,
  onShare,
  onOpenMore,
  mine = false,
  sharing = false,
}: Props) {
  const ActionIcon = mine ? DownloadIcon : ShareIcon;
  return (
    <View className="w-full bg-black" style={{ height }}>
      {reels.video_url && active ? (
        <VideoView
          player={player}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          nativeControls={false}
        />
      ) : reels.thumbnail_url ? (
        <Image
          source={{ uri: reels.thumbnail_url }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View className="h-full w-full bg-neutral-800" />
      )}

      {/* 하단 그라데이션 — 텍스트 가독성 확보 */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.85)"]}
        locations={[0, 0.45, 1]}
        className="absolute inset-x-0 bottom-0"
        style={{ height: verticalScale(320) }}
        pointerEvents="none"
      />

      {/* 우측 세로 액션바 */}
      <View
        className="absolute items-center"
        style={{
          right: scale(12),
          bottom: verticalScale(120),
          gap: verticalScale(20),
        }}
      >
        <Pressable
          className="items-center active:opacity-60"
          style={{ gap: verticalScale(4) }}
          hitSlop={moderateScale(8)}
          onPress={() => onToggleLike(reels.reels_idx)}
          accessibilityRole="button"
          accessibilityLabel={reels.liked ? "좋아요 취소" : "좋아요"}
        >
          <HeartIcon
            width={moderateScale(ICON.heart.w)}
            height={moderateScale(ICON.heart.h)}
            color={reels.liked ? "#FF4D6D" : "#FFFFFF"}
            filled={reels.liked}
          />
          <Text
            className="text-white"
            style={{ fontSize: moderateScale(12), fontWeight: "600" }}
          >
            {formatCount(reels.like_count)}
          </Text>
        </Pressable>

        <Pressable
          className="items-center active:opacity-60"
          style={{ gap: verticalScale(4) }}
          hitSlop={moderateScale(8)}
          onPress={() => onOpenComments(reels.reels_idx)}
          accessibilityRole="button"
          accessibilityLabel="댓글 보기"
        >
          <CommentIcon
            width={moderateScale(ICON.comment.w)}
            height={moderateScale(ICON.comment.h)}
            color="#FFFFFF"
          />
          <Text
            className="text-white"
            style={{ fontSize: moderateScale(12), fontWeight: "600" }}
          >
            {formatCount(reels.comment_count)}
          </Text>
        </Pressable>

        <Pressable
          className="items-center active:opacity-60"
          hitSlop={moderateScale(8)}
          disabled={sharing}
          onPress={() => onShare(reels)}
          accessibilityRole="button"
          accessibilityLabel={mine ? "갤러리에 저장" : "공유"}
        >
          {sharing ? (
            <ActivityIndicator
              color="#FFFFFF"
              style={{
                width: moderateScale(ICON.share.w),
                height: moderateScale(ICON.share.h),
              }}
            />
          ) : (
            <ActionIcon
              width={moderateScale(ICON.share.w)}
              height={moderateScale(ICON.share.h)}
              color="#FFFFFF"
            />
          )}
        </Pressable>

        {/* ⋯ — 신고·차단. 공유 바로 아래. */}
        {onOpenMore ? (
        <Pressable
          className="items-center active:opacity-60"
          hitSlop={moderateScale(8)}
          onPress={() => onOpenMore(reels)}
          accessibilityRole="button"
          accessibilityLabel="더보기"
        >
          <Text
            className="font-bold text-white"
            style={{ fontSize: moderateScale(22), lineHeight: moderateScale(22) }}
          >
            ⋯
          </Text>
        </Pressable>
        ) : null}
      </View>

      {/* 하단 정보: 작성자 · 캡션 · 위치 */}
      <View
        className="absolute bottom-0 left-0"
        style={{
          paddingLeft: scale(16),
          paddingBottom: verticalScale(24),
          paddingRight: scale(72), // 액션바와 겹치지 않도록
          gap: verticalScale(8),
        }}
      >
        <View className="flex-row items-center" style={{ gap: scale(8) }}>
          {reels.author.avatar_url ? (
            <Image
              source={{ uri: reels.author.avatar_url }}
              style={{
                width: moderateScale(32),
                height: moderateScale(32),
                borderRadius: moderateScale(16),
              }}
              contentFit="cover"
            />
          ) : (
            <View
              className="bg-neutral-600"
              style={{
                width: moderateScale(32),
                height: moderateScale(32),
                borderRadius: moderateScale(16),
              }}
            />
          )}
          <Text
            className="text-white"
            style={{ fontSize: moderateScale(14), fontWeight: "600" }}
          >
            {reels.author.name}
          </Text>
        </View>

        <Text
          className="text-white"
          style={{ fontSize: moderateScale(14), lineHeight: moderateScale(20) }}
        >
          {reels.caption}
        </Text>

        {reels.location ? (
          <View className="flex-row items-center" style={{ gap: scale(4) }}>
            <PlaceMarkerIcon
              width={moderateScale(10)}
              height={moderateScale(13)}
              color="#FFFFFF"
              dotFill="#3A3A3A"
            />
            <Text
              className="text-white/80"
              style={{ fontSize: moderateScale(12) }}
            >
              {reels.location}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
