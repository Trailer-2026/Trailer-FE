import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-16 items-center">
          <Text className="text-5xl font-bold text-gray-900 mb-4">Trailer</Text>
          <Text className="text-lg text-gray-500 text-center leading-relaxed">
            나만의 영화 트레일러{"\n"}지금 시작해보세요
          </Text>
        </View>

        <TouchableOpacity
          className="w-full bg-gray-900 rounded-2xl py-4 items-center"
          onPress={() => router.push("/(onboarding)/login")}
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-semibold">시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
