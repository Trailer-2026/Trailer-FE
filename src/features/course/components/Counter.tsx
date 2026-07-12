import Feather from "@expo/vector-icons/Feather";
import { Pressable, View } from "react-native";
import { Text } from "@/src/components/Text";

import { moderateScale, scale } from "@/src/utils/responsive";

type Props = {
  value: number;
  min?: number;
  onChange: (delta: number) => void;
};

const SIZE = scale(35);

export function Counter({ value, min = 0, onChange }: Props) {
  const minusDisabled = value <= min;
  // 1 이상 선택 시 부호·테두리·숫자를 강조색으로.
  const active = value >= 1;
  const accent = "#5E84F4";
  const symbolColor = active ? accent : "#5F5F5F"; // 미선택 부호색
  const borderColor = active ? accent : "#D1D5DB"; // 미선택 테두리 회색

  const btnStyle = {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: moderateScale(1.5),
    borderColor,
    alignItems: "center",
    justifyContent: "center",
  } as const;

  return (
    <View className="flex-row items-center" style={{ gap: scale(14) }}>
      <Pressable
        onPress={() => !minusDisabled && onChange(-1)}
        disabled={minusDisabled}
        hitSlop={8}
        style={btnStyle}
      >
        <Feather name="minus" size={moderateScale(18)} color={symbolColor} />
      </Pressable>

      <Text
        className="font-semibold text-center"
        style={{
          fontSize: moderateScale(20),
          width: scale(24),
          color: active ? accent : "#111827",
        }}
      >
        {value}
      </Text>

      <Pressable onPress={() => onChange(1)} hitSlop={8} style={btnStyle}>
        <Feather name="plus" size={moderateScale(18)} color={symbolColor} />
      </Pressable>
    </View>
  );
}
