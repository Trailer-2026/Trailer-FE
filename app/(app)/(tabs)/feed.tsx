import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";
import { Text } from "@/src/components/Text";

export default function FeedTab() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-base text-gray-400">피드</Text>
      </View>
    </SafeAreaView>
  );
}
