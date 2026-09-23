import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { describeApiError } from "@/src/api/errors";
import BackIcon from "@/src/components/icons/BackIcon";
import PlayIcon from "@/src/components/icons/PlayIcon";
import { Text } from "@/src/components/Text";
import DraggableTimeline from "@/src/features/reels/components/DraggableTimeline";
import GradedPhoto from "@/src/features/reels/components/GradedPhoto";
import RenderOptions from "@/src/features/reels/components/RenderOptions";
import {
  ThemeBackground,
  ThemeParticles,
} from "@/src/features/reels/components/ThemePreview";
import { useReelsCreateStore } from "@/src/features/reels/create-store";
import {
  clipDurationSeconds,
  formatClock,
  formatTimelineLabel,
  totalDurationSeconds,
} from "@/src/features/reels/media";
import { useActiveRenderStore } from "@/src/features/video/active-render-store";
import { DEFAULT_RENDER_OPTIONS } from "@/src/features/video/options";
import { useRenderPhotosOrdered } from "@/src/features/video/queries";
import type { RenderOptions as RenderOptionsValue } from "@/src/features/video/types";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

/** GPS 정보가 있어야 하는 최소 항목 수(서버 요건). */
const MIN_GPS_ITEMS = 2;
/** 영상 클립 합계 최대 초(서버 요건: 각 5초, 합계 15초). */
const MAX_VIDEO_TOTAL_SECONDS = 15;

const ACCENT = "#5E84F4"; // + 버튼
const THUMB_W = 78;
const THUMB_H = 56;
const THUMB_GAP = 2;

/**
 * 영상 만들기 2단계 — 고른 미디어 미리보기 · 순서 정렬 · 추가.
 *
 * 순서는 그대로 영상의 클립 순서가 된다(길게 눌러 드래그).
 */
export default function ReelsEditScreen() {
  const assets = useReelsCreateStore((s) => s.assets);
  const reorder = useReelsCreateStore((s) => s.reorder);

  // 위쪽 큰 미리보기에 띄울 항목. 목록이 줄어들 수 있어 인덱스가 아니라 uri 로 잡는다.
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const selected =
    assets.find((a) => a.uri === selectedUri) ?? assets[0] ?? null;

  // 렌더 옵션(테마/조명/엔진/인트로/아웃트로). quick·bgm 은 기본값 고정.
  const [options, setOptions] = useState<RenderOptionsValue>(
    DEFAULT_RENDER_OPTIONS,
  );
  const patchOptions = (patch: Partial<RenderOptionsValue>) =>
    setOptions((prev) => ({ ...prev, ...patch }));

  const render = useRenderPhotosOrdered();
  const startTracking = useActiveRenderStore((s) => s.start);

  // GPS 항목 수(사진은 갤러리에서 이미 GPS 보장, 영상은 GPS 없을 수 있음)
  const gpsCount = assets.filter(
    (a) => a.latitude != null && a.longitude != null,
  ).length;
  // 영상 클립 합계 길이(각 최대 5초 적용)
  const totalVideoSecs = assets
    .filter((a) => a.kind === "video")
    .reduce((sum, a) => sum + clipDurationSeconds(a), 0);

  const onCreate = () => {
    if (render.isPending) return;
    if (assets.length < MIN_GPS_ITEMS) {
      Alert.alert("파일이 부족해요", "사진·영상이 최소 2개 필요해요.");
      return;
    }
    if (gpsCount < MIN_GPS_ITEMS) {
      Alert.alert(
        "위치 정보 부족",
        "GPS 정보가 있는 사진·영상이 최소 2개 필요해요.\n카카오톡 등으로 전달받은 파일은 GPS가 제거돼 있을 수 있어요.",
      );
      return;
    }
    if (totalVideoSecs > MAX_VIDEO_TOTAL_SECONDS) {
      Alert.alert(
        "영상이 너무 많아요",
        `영상 클립은 합쳐서 최대 ${MAX_VIDEO_TOTAL_SECONDS}초까지 넣을 수 있어요.\n(영상마다 앞 5초만 사용됩니다)`,
      );
      return;
    }
    // photos-ordered 는 보낸 순서를 그대로 쓴다 — 타임라인 순서가 곧 영상 순서.
    render.mutate(
      { media: assets, options },
      {
        onSuccess: (status) => {
          startTracking(status.reels_idx);
          router.push(`/reels/progress?reels_idx=${status.reels_idx}`);
        },
        onError: (err) => Alert.alert("영상 만들기 실패", describeApiError(err)),
      },
    );
  };

  const canCreate = gpsCount >= MIN_GPS_ITEMS && !render.isPending;
  const totalSeconds = totalDurationSeconds(assets);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* 테마 하늘색 — 콘텐츠보다 먼저 그려 뒤에 깔린다(파티클은 맨 앞, 화면 끝에서). */}
      <ThemeBackground theme={options.theme} />

      {/* 헤더: 뒤로 / 생성하기 */}
      <View
        className="flex-row items-center justify-between"
        style={{ paddingHorizontal: scale(20), ...headerBarStyle() }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{
            width: scale(28),
            height: scale(28),
            justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <BackIcon
            color="#FFFFFF"
            width={moderateScale(12)}
            height={moderateScale(17)}
          />
        </Pressable>

        <Pressable
          onPress={onCreate}
          disabled={!canCreate}
          hitSlop={12}
          className="active:opacity-60"
          style={{ opacity: canCreate ? 1 : 0.4 }}
          accessibilityRole="button"
          accessibilityLabel="영상 생성하기"
        >
          <Text
            className="font-semibold text-white"
            style={{ fontSize: moderateScale(15) }}
          >
            {render.isPending ? "만드는 중…" : "생성하기"}
          </Text>
        </Pressable>
      </View>

      {/* 큰 미리보기 */}
      <View className="flex-1 items-center justify-center">
        {selected ? (
          selected.kind === "video" ? (
            // 영상: expo-image 가 안드로이드에서 video/file:// URI 의 첫 프레임을 썸네일로 렌더링.
            <View
              className="items-center justify-center overflow-hidden"
              style={{
                width: scale(248),
                height: verticalScale(370),
                backgroundColor: "#111",
              }}
            >
              <Image
                source={{ uri: selected.uri }}
                contentFit="cover"
                style={{ width: "100%", height: "100%" }}
              />
              <View
                className="absolute items-center justify-center"
                pointerEvents="none"
                style={{
                  width: scale(52),
                  height: scale(52),
                  borderRadius: scale(26),
                  backgroundColor: "rgba(0,0,0,0.55)",
                }}
              >
                <PlayIcon
                  color="#FFFFFF"
                  filled
                  holeColor="#000000"
                  width={moderateScale(20)}
                  height={moderateScale(20)}
                />
              </View>
            </View>
          ) : (
            // 사진: 렌더러가 지도에 굽는 것과 같은 색보정을 걸어 결과 색감을 보여준다.
            <GradedPhoto
              uri={selected.uri}
              theme={options.theme}
              width={scale(248)}
              height={verticalScale(370)}
            />
          )
        ) : (
          <Text
            className="text-gray-500"
            style={{ fontSize: moderateScale(13) }}
          >
            선택된 사진이 없어요
          </Text>
        )}
      </View>

      {/* 재생바 — TODO(영상): 실제 재생기가 붙으면 진행 시간으로 교체. 지금은 총 길이만 표시. */}
      <View
        className="flex-row items-center justify-center"
        style={{ gap: scale(8), paddingBottom: verticalScale(16) }}
      >
        <PlayIcon
          color="#FFFFFF"
          filled
          holeColor="#000000"
          width={moderateScale(16)}
          height={moderateScale(16)}
        />
        <Text className="text-white" style={{ fontSize: moderateScale(13) }}>
          0:00 / {formatClock(totalSeconds)}
        </Text>
      </View>

      {/* 렌더 옵션 — 화면이 작아도 눌러 스크롤할 수 있게 높이를 제한한다. */}
      <ScrollView
        style={{ maxHeight: verticalScale(180) }}
        contentContainerStyle={{
          paddingHorizontal: scale(20),
          paddingBottom: verticalScale(14),
        }}
        showsVerticalScrollIndicator={false}
      >
        <RenderOptions value={options} onChange={patchOptions} />
      </ScrollView>

      {/* 하단 타임라인: + 추가 버튼 + 드래그로 순서 바꾸는 썸네일 목록 */}
      <View
        className="flex-row"
        style={{
          backgroundColor: "#1C1C1C",
          paddingVertical: verticalScale(12),
          paddingLeft: scale(16),
          gap: scale(12),
        }}
      >
        <Pressable
          onPress={() => router.push("/reels/gallery?mode=add")}
          className="items-center justify-center active:opacity-70"
          style={{
            width: scale(THUMB_H),
            height: scale(THUMB_H),
            borderRadius: scale(8),
            backgroundColor: ACCENT,
          }}
          accessibilityRole="button"
          accessibilityLabel="사진 더 추가하기"
        >
          <Text
            className="font-bold text-white"
            style={{ fontSize: moderateScale(24) }}
          >
            +
          </Text>
        </Pressable>

        <DraggableTimeline
          assets={assets}
          thumbW={THUMB_W}
          thumbH={THUMB_H}
          gap={THUMB_GAP}
          selectedUri={selected?.uri ?? null}
          onSelect={setSelectedUri}
          onReorder={reorder}
          labelFor={(index) => {
            // 각 클립의 누적 시작 시각(초)을 레이블로 표시
            let t = 0;
            for (let i = 0; i < index; i++) t += clipDurationSeconds(assets[i]);
            return formatTimelineLabel(t);
          }}
        />
      </View>

      {/* 파티클은 사진 위로 떨어져야 영상과 같아 보인다 — 맨 마지막에 그린다. */}
      <ThemeParticles theme={options.theme} />
    </SafeAreaView>
  );
}
