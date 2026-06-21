import { View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/features/auth/store";
import { logout } from "@/src/features/auth/api";

export default function MainScreen() {
  const clear = useAuthStore((s) => s.clear);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // 서버 로그아웃 실패해도 로컬 토큰은 삭제
    } finally {
      await clear();
    }
  }

  function confirmLogout() {
    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: handleLogout },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-2xl font-bold text-gray-900 mb-2">메인 화면</Text>
        <Text className="text-sm text-gray-400 mb-16">로그인 성공!</Text>

        <TouchableOpacity
          className="w-full border border-gray-200 rounded-2xl py-4 items-center"
          onPress={confirmLogout}
          activeOpacity={0.85}
        >
          <Text className="text-base text-gray-500">로그아웃</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
