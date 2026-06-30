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
    <View className="flex-row items-center gap-4">
      <Pressable
        onPress={() => !minusDisabled && onChange(-1)}
        disabled={minusDisabled}
        hitSlop={8}
        className={`w-11 h-11 rounded-full items-center justify-center ${
          minusDisabled ? "bg-gray-200" : "bg-gray-700"
        }`}
      >
        <Feather
          name="minus"
          size={18}
          color={minusDisabled ? "#9CA3AF" : "#FFFFFF"}
        />
      </Pressable>
      <Text className="text-lg font-semibold text-gray-900 w-6 text-center">
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(1)}
        hitSlop={8}
        className="w-11 h-11 rounded-full items-center justify-center bg-gray-700"
      >
        <Feather name="plus" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
