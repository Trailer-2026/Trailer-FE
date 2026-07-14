import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, View } from "react-native";

import CommentIcon from "@/src/components/icons/CommentIcon";
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
  onToggleLike: (reelsIdx: number) => void;
};

/** 1000 이상은 "1.2천"으로 축약 — 액션바 폭이 좁아 자릿수를 제한한다. */
function formatCount(n: number) {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}천`;
}

export default function ReelsCard({ reels, height, onToggleLike }: Props) {
  return (
    <View className="w-full bg-black" style={{ height }}>
      {/* 영상 제작 로직이 아직 없어 정지 이미지(썸네일)로 대체 렌더한다.
          TODO(영상): video_url 이 생기면 expo-video 플레이어로 교체하고,
          현재 보이는 카드만 재생하도록 viewability 로 제어. */}
      {reels.thumbnail_url ? (
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
            width={moderateScale(28)}
            height={moderateScale(28)}
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
          // TODO(댓글): 댓글 화면(바텀시트) 열기 — 이번 범위 밖.
          onPress={() => {}}
          accessibilityRole="button"
          accessibilityLabel="댓글 보기"
        >
          <CommentIcon
            width={moderateScale(28)}
            height={moderateScale(28)}
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
          // TODO(공유): 시스템 공유 시트 연결 — 이번 범위 밖.
          onPress={() => {}}
          accessibilityRole="button"
          accessibilityLabel="공유"
        >
          <ShareIcon
            width={moderateScale(26)}
            height={moderateScale(26)}
            color="#FFFFFF"
          />
        </Pressable>
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
