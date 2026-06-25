import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";

type Props = {
  value: number;
  min?: number;
  onChange: (delta: number) => void;
};

export function Counter({ value, min = 0, onChange }: Props) {
  const minusDisabled = value <= min;
  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={() => !minusDisabled && onChange(-1)}
        disabled={minusDisabled}
        hitSlop={8}
        className={`w-8 h-8 rounded-full items-center justify-center border ${
          minusDisabled ? "border-gray-200" : "border-gray-400"
        }`}
      >
        <Feather
          name="minus"
          size={16}
          color={minusDisabled ? "#D1D5DB" : "#374151"}
        />
      </Pressable>
      <Text className="text-base font-semibold text-gray-900 w-5 text-center">
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(1)}
        hitSlop={8}
        className="w-8 h-8 rounded-full items-center justify-center border border-gray-400"
      >
        <Feather name="plus" size={16} color="#374151" />
      </Pressable>
    </View>
  );
}
