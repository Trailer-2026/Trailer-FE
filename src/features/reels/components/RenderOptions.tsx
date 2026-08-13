import { useVideoPlayer } from "expo-video";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { Text } from "@/src/components/Text";
import { THEME_OPTIONS } from "@/src/features/video/options";
import { useBgmTracks } from "@/src/features/video/queries";
import type { RenderOptions as RenderOptionsValue } from "@/src/features/video/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";

/**
 * 미리듣기 음원 — 서버 bgm/ 폴더와 같은 mp3 를 앱에 번들해 오프라인에서도 들린다.
 * 키는 서버가 주는 title(파일명 "곡명 - 아티스트.mp3" 의 곡명). 곡이 추가되면 여기도 추가.
 * ponytail: 4곡 15MB. 곡이 더 늘면 번들 대신 서버 스트리밍으로 바꿀 것.
 */
const BGM_PREVIEW: Record<string, number> = {
  Beats: require("@/assets/bgm/beats.mp3"),
  Funk: require("@/assets/bgm/funk.mp3"),
  Instrumental: require("@/assets/bgm/instrumental.mp3"),
  "Rock Trailer": require("@/assets/bgm/rock-trailer.mp3"),
};

type Props = {
  value: RenderOptionsValue;
  onChange: (patch: Partial<RenderOptionsValue>) => void;
};

/**
 * 릴스 편집 화면의 렌더 옵션 패널 — 테마·BGM 칩.
 * BGM 목록은 서버(useBgmTracks)에서 받아 "무음 + 트랙들"로 구성한다.
 * 엔진(항상 modal)·인트로/아웃트로(항상 포함)는 서버 고정이라 UI 가 없다.
 */
export default function RenderOptions({ value, onChange }: Props) {
  const { data: tracks } = useBgmTracks();

  // 무음 + 서버 트랙(값=file, 라벨=title).
  const bgmOptions = [
    { value: "", label: "무음" },
    ...(tracks ?? []).map((t) => ({ value: t.file, label: t.title })),
  ];

  // 미리듣기 — 화면당 플레이어 1개. 화면을 벗어나면 훅이 알아서 정리한다.
  const [previewing, setPreviewing] = useState<string | null>(null);
  const player = useVideoPlayer(null, (p) => {
    p.loop = true; // 미리듣기라 반복 재생 — 멈춤은 사용자가 한다
  });

  // 지금 고른 곡의 번들 음원(무음이거나 번들에 없으면 undefined → 버튼 비활성).
  const selectedTitle =
    bgmOptions.find((o) => o.value === value.bgm)?.label ?? "";
  const previewSource = BGM_PREVIEW[selectedTitle];
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

  // 다른 곡으로 바꾸면 듣고 있던 건 멈춘다(재생 상태가 선택과 어긋나지 않게).
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

/** 선택한 곡 미리듣기 토글 버튼. 무음·번들에 없는 곡이면 흐리게 비활성. */
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
        paddingHorizontal: scale(10),
        paddingVertical: verticalScale(6),
        borderRadius: scale(14),
        borderWidth: 1,
        borderColor: disabled ? "#3A3A3A" : ACCENT,
        gap: scale(5),
      }}
      accessibilityRole="button"
      accessibilityLabel={playing ? "미리듣기 정지" : "미리듣기"}
    >
      {playing ? (
        // 정지(■) / 재생(▶) — 아이콘 파일을 따로 둘 만한 모양이 아니다.
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
      <Text style={{ fontSize: moderateScale(12), color }}>
        {playing ? "정지" : "미리듣기"}
      </Text>
    </Pressable>
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
