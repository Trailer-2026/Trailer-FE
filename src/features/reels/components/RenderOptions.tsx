import { Pressable, Switch, View } from "react-native";

import { Text } from "@/src/components/Text";
import {
  ENGINE_OPTIONS,
  LIGHT_OPTIONS,
  THEME_OPTIONS,
} from "@/src/features/video/options";
import type { RenderOptions as RenderOptionsValue } from "@/src/features/video/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";

type Props = {
  value: RenderOptionsValue;
  onChange: (patch: Partial<RenderOptionsValue>) => void;
};

/**
 * 릴스 편집 화면의 렌더 옵션 패널 — 테마/조명/엔진 칩 + 인트로·아웃트로 토글.
 * quick(true 고정)·bgm("")·출발지는 이번엔 UI 없이 기본값으로 전송한다.
 */
export default function RenderOptions({ value, onChange }: Props) {
  return (
    <View style={{ gap: verticalScale(10) }}>
      <ChipRow
        label="테마"
        options={THEME_OPTIONS}
        selected={value.theme}
        onSelect={(theme) => onChange({ theme })}
      />
      <ChipRow
        label="조명"
        options={LIGHT_OPTIONS}
        selected={value.light_preset}
        onSelect={(light_preset) => onChange({ light_preset })}
      />
      <ChipRow
        label="엔진"
        options={ENGINE_OPTIONS}
        selected={value.engine}
        onSelect={(engine) => onChange({ engine })}
      />

      <View className="flex-row" style={{ gap: scale(24) }}>
        <ToggleRow
          label="인트로"
          value={value.intro}
          onChange={(intro) => onChange({ intro })}
        />
        <ToggleRow
          label="아웃트로"
          value={value.outro}
          onChange={(outro) => onChange({ outro })}
        />
      </View>
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

/** 라벨 + 스위치. */
function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View className="flex-row items-center" style={{ gap: scale(8) }}>
      <Text className="text-gray-300" style={{ fontSize: moderateScale(12) }}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#3A3A3A", true: ACCENT }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
