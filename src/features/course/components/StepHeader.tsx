import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

type Props = {
  progress: number;
};

export function StepHeader({ progress }: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View className="px-5 pt-2 pb-3 flex-row items-center gap-3">
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        className="w-7 h-7 items-center justify-center"
      >
        <Feather name="chevron-left" size={24} color="#111827" />
      </Pressable>
      <View className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full bg-gray-800 rounded-full"
          style={{ width: `${clamped * 100}%` }}
        />
      </View>
    </View>
  );
}
