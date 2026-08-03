import { Pressable, View } from "react-native";

import { Text } from "@/src/components/Text";
import { THEME_OPTIONS } from "@/src/features/video/options";
import { useBgmTracks } from "@/src/features/video/queries";
import type { RenderOptions as RenderOptionsValue } from "@/src/features/video/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";

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

  return (
    <View style={{ gap: verticalScale(10) }}>
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
        onSelect={(bgm) => onChange({ bgm })}
      />
    </View>
  );
}

/** 라벨 + 단일 선택 칩 한 줄. 제네릭으로 각 옵션 그룹의 리터럴 타입을 보존. */
function ChipRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
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
      </View>
    </View>
  );
}
