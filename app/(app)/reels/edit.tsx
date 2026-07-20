import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import PlayIcon from "@/src/components/icons/PlayIcon";
import { Text } from "@/src/components/Text";
import { captureFromCamera, promptMediaSource } from "@/src/features/reels/capture";
import DraggableTimeline from "@/src/features/reels/components/DraggableTimeline";
import { useReelsCreateStore } from "@/src/features/reels/create-store";
import {
  SECONDS_PER_PHOTO,
  formatClock,
  formatTimelineLabel,
  totalDurationSeconds,
} from "@/src/features/reels/media";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

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
    // TODO(백엔드 업로드): 여기서 assets 를 순서대로 서버에 전송한다.
    //   - 각 항목의 uri 를 multipart/form-data 로 업로드 (파일 + taken_at + latitude/longitude)
    //   - 응답으로 reels_idx 를 받아 피드로 이동
    //   - 업로드 진행률 표시 화면 필요
    //   현재는 API 스펙이 없어 선택 결과만 확인시킨다.
    Alert.alert(
      "생성하기",
      `사진 ${assets.length}장으로 영상을 만듭니다.\n(백엔드 업로드는 다음 단계에서 연결됩니다)`,
    );
  };

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
          disabled={assets.length === 0}
          hitSlop={12}
          className="active:opacity-60"
          style={{ opacity: assets.length === 0 ? 0.4 : 1 }}
          accessibilityRole="button"
          accessibilityLabel="영상 생성하기"
        >
          <Text
            className="font-semibold text-white"
            style={{ fontSize: moderateScale(15) }}
          >
            생성하기
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
