import Feather from "@expo/vector-icons/Feather";
import { Pressable, View } from "react-native";
import { Text } from "@/src/components/Text";

import { moderateScale, scale } from "@/src/utils/responsive";

type Props = {
  value: number;
  min?: number;
  onChange: (delta: number) => void;
};

const BTN = {
  width: scale(35),
  height: scale(35),
  borderRadius: scale(35) / 2,
  alignItems: "center",
  justifyContent: "center",
} as const;

export function Counter({ value, min = 0, onChange }: Props) {
  const minusDisabled = value <= min;
  return (
    <View className="flex-row items-center" style={{ gap: scale(12) }}>
      <Pressable
        onPress={() => !minusDisabled && onChange(-1)}
        disabled={minusDisabled}
        hitSlop={8}
        style={{ ...BTN, backgroundColor: minusDisabled ? "#C3D2FB" : "#668DFF" }}
      >
        <Feather name="minus" size={moderateScale(18)} color="#FFFFFF" />
      </Pressable>

      <Text
        className="font-medium text-gray-900 text-center"
        style={{ fontSize: moderateScale(20), width: scale(24) }}
      >
        {value}
      </Text>

      <Pressable
        onPress={() => onChange(1)}
        hitSlop={8}
        style={{ ...BTN, backgroundColor: "#668DFF" }}
      >
        <Feather name="plus" size={moderateScale(18)} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
