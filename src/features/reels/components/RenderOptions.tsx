import { Image } from "expo-image";
import { useVideoPlayer } from "expo-video";
import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";

import { Text } from "@/src/components/Text";
import type { ReelsMediaAsset } from "@/src/features/reels/types";
import { THEME_OPTIONS } from "@/src/features/video/options";
import type { RenderOptions as RenderOptionsValue } from "@/src/features/video/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";

/** bgm 파라미터값(곡 제목) → 번들 mp3 매핑. */
const BGM_PREVIEW: Record<string, number> = {
  "Take Off": require("@/assets/bgm/take-off.mp3"),
  Holiday: require("@/assets/bgm/holiday.mp3"),
  "Follow The Sun": require("@/assets/bgm/follow-the-sun.mp3"),
  "Ocean Vibes": require("@/assets/bgm/ocean-vibes.mp3"),
  "Last Summer": require("@/assets/bgm/last-summer.mp3"),
};

/** bgm 파라미터로 그대로 전송되는 곡 제목 목록. */
const BGM_TRACKS: { value: string; label: string }[] = [
  { value: "Take Off", label: "Take Off" },
  { value: "Holiday", label: "Holiday" },
  { value: "Follow The Sun", label: "Follow The Sun" },
  { value: "Ocean Vibes", label: "Ocean Vibes" },
  { value: "Last Summer", label: "Last Summer" },
];

type Props = {
  value: RenderOptionsValue;
  onChange: (patch: Partial<RenderOptionsValue>) => void;
  assets?: ReelsMediaAsset[];
};

/**
 * 릴스 편집 화면의 렌더 옵션 패널 — 테마·BGM 칩.
 * 엔진(항상 modal)·인트로/아웃트로(항상 포함)는 서버 고정이라 UI 가 없다.
 */
export default function RenderOptions({ value, onChange, assets }: Props) {
  const bgmOptions = [
    { value: "", label: "무음" },
    ...BGM_TRACKS,
  ];

  const [previewing, setPreviewing] = useState<string | null>(null);
  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
  });

  const previewSource = BGM_PREVIEW[value.bgm];
  const playing = previewing === value.bgm;

  const togglePreview = () => {
    if (playing) {
      player.pause();
      setPreviewing(null);
      return;
    }
    if (!previewSource) return;
    setPreviewing(value.bgm);
    player.replaceAsync(previewSource).then(() => player.play());
  };

  const selectBgm = (bgm: string) => {
    if (previewing && previewing !== bgm) {
      player.pause();
      setPreviewing(null);
    }
    onChange({ bgm });
  };

  return (
    <View style={{ gap: verticalScale(10) }}>
      {/* 릴스 제목 — 렌더 시작 때만 정할 수 있다(서버에 제목 변경 API 가 없다). */}
      <View className="flex-row items-center" style={{ gap: scale(10) }}>
        <Text
          className="text-gray-400"
          style={{ fontSize: moderateScale(12), width: scale(32) }}
        >
          제목
        </Text>
        <TextInput
          value={value.title ?? ""}
          onChangeText={(title) => onChange({ title })}
          placeholder="영상 이름 (선택)"
          placeholderTextColor="#6B7280"
          maxLength={100}
          className="flex-1 text-white"
          style={{
            backgroundColor: "#2A2A2A",
            borderRadius: scale(14),
            paddingHorizontal: scale(12),
            paddingVertical: verticalScale(6),
            fontSize: moderateScale(12),
          }}
        />
      </View>

      {assets && assets.length > 0 && (
        <CoverRow
          assets={assets}
          selected={value.cover_index ?? 1}
          onSelect={(idx) => onChange({ cover_index: idx })}
        />
      )}
      <ChipRow
        label="테마"
        options={THEME_OPTIONS}
        selected={value.theme}
        onSelect={(theme) => onChange({ theme })}
      />
      <ChipRow
        label="음악"
        options={bgmOptions}
        selected={value.bgm}
        onSelect={selectBgm}
        trailing={
          <PreviewButton
            playing={playing}
            disabled={!previewSource}
            onPress={togglePreview}
          />
        }
      />
    </View>
  );
}

/** 선택한 곡 미리듣기 토글 버튼. 무음이면 흐리게 비활성. */
function PreviewButton({
  playing,
  disabled,
  onPress,
}: {
  playing: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const color = disabled ? "#6B7280" : "#FFFFFF";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center active:opacity-70"
      style={{
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(6),
        borderRadius: scale(14),
        backgroundColor: playing ? ACCENT : "#2A2A2A",
        opacity: disabled ? 0.5 : 1,
        gap: scale(5),
      }}
      accessibilityRole="button"
      accessibilityLabel={playing ? "미리듣기 정지" : "미리듣기"}
    >
      {playing ? (
        <View
          style={{
            width: moderateScale(8),
            height: moderateScale(8),
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
      ) : (
        <View
          style={{
            width: 0,
            height: 0,
            borderTopWidth: moderateScale(4.5),
            borderBottomWidth: moderateScale(4.5),
            borderLeftWidth: moderateScale(7),
            borderTopColor: "transparent",
            borderBottomColor: "transparent",
            borderLeftColor: color,
          }}
        />
      )}
      <Text
        className="font-semibold"
        style={{ fontSize: moderateScale(12), color }}
      >
        {playing ? "정지" : "미리듣기"}
      </Text>
    </Pressable>
  );
}

/** 표지(썸네일)로 쓸 파일을 고르는 가로 스크롤 행. selected는 1-based. */
function CoverRow({
  assets,
  selected,
  onSelect,
}: {
  assets: ReelsMediaAsset[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  return (
    <View className="flex-row items-center" style={{ gap: scale(10) }}>
      <Text
        className="text-gray-400"
        style={{ fontSize: moderateScale(12), width: scale(32) }}
      >
        표지
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: scale(6) }}
        style={{ flex: 1 }}
      >
        {assets.map((asset, i) => {
          const isSelected = selected === i + 1;
          return (
            <Pressable
              key={asset.uri}
              onPress={() => onSelect(i + 1)}
              className="active:opacity-70"
              style={{
                width: scale(40),
                height: verticalScale(54),
                borderRadius: scale(6),
                overflow: "hidden",
                borderWidth: isSelected ? 2 : 0,
                borderColor: ACCENT,
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${i + 1}번 파일을 표지로`}
            >
              <Image
                source={{ uri: asset.uri }}
                contentFit="cover"
                style={{ width: "100%", height: "100%" }}
              />
              {isSelected && (
                <View
                  className="absolute items-center justify-center"
                  style={{
                    top: scale(3),
                    right: scale(3),
                    width: moderateScale(16),
                    height: moderateScale(16),
                    borderRadius: moderateScale(8),
                    backgroundColor: ACCENT,
                  }}
                >
                  <Text
                    className="font-bold text-white"
                    style={{ fontSize: moderateScale(10) }}
                  >
                    ✓
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** 라벨 + 단일 선택 칩 한 줄. 제네릭으로 각 옵션 그룹의 리터럴 타입을 보존. */
function ChipRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
  trailing,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
  /** 칩 뒤에 이어 붙는 버튼(음악 줄의 미리듣기). 칩과 같이 줄바꿈된다. */
  trailing?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center" style={{ gap: scale(10) }}>
      <Text
        className="text-gray-400"
        style={{ fontSize: moderateScale(12), width: scale(32) }}
      >
        {label}
      </Text>
      <View className="flex-row flex-1 flex-wrap" style={{ gap: scale(6) }}>
        {options.map((opt) => {
          const active = opt.value === selected;
          return (
            <Pressable
              key={opt.value || "default"}
              onPress={() => onSelect(opt.value)}
              className="active:opacity-70"
              style={{
                paddingHorizontal: scale(12),
                paddingVertical: verticalScale(6),
                borderRadius: scale(14),
                backgroundColor: active ? ACCENT : "#2A2A2A",
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${label} ${opt.label}`}
            >
              <Text
                className={active ? "font-semibold text-white" : "text-gray-300"}
                style={{ fontSize: moderateScale(12) }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
        {trailing}
      </View>
    </View>
  );
}
