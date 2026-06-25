import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";

export default function CalendarTab() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-base text-gray-400">캘린더</Text>
      </View>
    </SafeAreaView>
  );
}
