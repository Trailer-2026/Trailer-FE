import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import PlayIcon from "@/src/components/icons/PlayIcon";
import { Text } from "@/src/components/Text";
import { captureFromCamera, promptMediaSource } from "@/src/features/reels/capture";
import DraggableTimeline from "@/src/features/reels/components/DraggableTimeline";
import RenderOptions from "@/src/features/reels/components/RenderOptions";
import { useReelsCreateStore } from "@/src/features/reels/create-store";
import {
  SECONDS_PER_PHOTO,
  formatClock,
  formatTimelineLabel,
  totalDurationSeconds,
} from "@/src/features/reels/media";
import { describeRenderError } from "@/src/features/video/errors";
import { DEFAULT_RENDER_OPTIONS } from "@/src/features/video/options";
import { useRenderPhotosOnly } from "@/src/features/video/queries";
import type { RenderOptions as RenderOptionsValue } from "@/src/features/video/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

/** 사진→영상 렌더에 필요한 최소 사진 수(서버도 2장 미만이면 400). */
const MIN_PHOTOS = 2;

const ACCENT = "#5E84F4"; // + 버튼
const THUMB_W = 78;
const THUMB_H = 56;
const THUMB_GAP = 2;

/**
 * 영상 만들기 2단계 — 고른 미디어 미리보기 · 순서 정렬 · 추가.
 *
 * 순서는 그대로 영상의 클립 순서가 된다(길게 눌러 드래그).
 * "생성하기" 는 아직 백엔드 연결 전 — TODO 참고.
 */
export default function ReelsEditScreen() {
  const assets = useReelsCreateStore((s) => s.assets);
  const addAssets = useReelsCreateStore((s) => s.addAssets);
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

  const render = useRenderPhotosOnly();

  // photos-only 렌더 대상은 사진만. 영상이 섞여 있어도 사진만 추려 보낸다.
  const photos = assets.filter((a) => a.kind === "image");

  const onAddMore = async () => {
    const source = await promptMediaSource();
    if (source === "camera") {
      const media = await captureFromCamera();
      if (media && media.length > 0) addAssets(media);
    } else if (source === "gallery") {
      router.push("/reels/gallery?mode=add");
    }
  };

  const onCreate = () => {
    if (render.isPending) return;
    // 사전 검증 — 서버도 2장 미만이면 400 이지만 먼저 막아 요청을 아낀다.
    if (photos.length < MIN_PHOTOS) {
      Alert.alert(
        "사진이 부족해요",
        `영상으로 만들려면 사진이 최소 ${MIN_PHOTOS}장 필요해요.`,
      );
      return;
    }
    // 순서는 백엔드가 EXIF 촬영시각으로 정렬하므로 드래그 순서를 강제하지 않는다.
    render.mutate(
      { photos, options },
      {
        onSuccess: (status) => {
          router.push(`/reels/progress?job_id=${status.job_id}`);
        },
        // 400(GPS 부족·같은 장소·알 수 없는 옵션 등)은 서버 메시지를 그대로 노출.
        onError: (err) => Alert.alert("영상 만들기 실패", describeRenderError(err)),
      },
    );
  };

  const canCreate = photos.length >= MIN_PHOTOS && !render.isPending;
  const totalSeconds = totalDurationSeconds(assets);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* 헤더: 뒤로 / 생성하기 */}
      <View
        className="flex-row items-center justify-between"
        style={{ paddingHorizontal: scale(20), paddingTop: verticalScale(16) }}
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
          <Image
            source={{ uri: selected.uri }}
            contentFit="contain"
            style={{ width: scale(248), height: verticalScale(370) }}
          />
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
          onPress={onAddMore}
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
          labelFor={(index) => formatTimelineLabel(index * SECONDS_PER_PHOTO)}
        />
      </View>
    </SafeAreaView>
  );
}
