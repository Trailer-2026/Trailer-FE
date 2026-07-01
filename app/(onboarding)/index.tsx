import { ActivityIndicator, Alert, TouchableOpacity, View } from "react-native";
import { Text } from "@/src/components/Text";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { signInWithKakao, KakaoSignInError } from "@/src/features/auth/sign-in-kakao";
import { signInWithGoogle, GoogleSignInError } from "@/src/features/auth/sign-in-google";

type Provider = "kakao" | "google";

export default function OnboardingScreen() {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const isLoading = loadingProvider !== null;

  async function handleKakaoLogin() {
    if (isLoading) return;
    setLoadingProvider("kakao");
    try {
      await signInWithKakao();
      // 성공 시 가드가 자동으로 (app)으로 리다이렉트
    } catch (err: unknown) {
      const error = err as KakaoSignInError;
      if (error.type === "cancelled") return;
      if (error.type === "invalid_token") {
        Alert.alert("로그인 실패", "카카오 인증이 만료되었습니다. 다시 시도해주세요.");
      } else {
        Alert.alert("오류", "로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setLoadingProvider(null);
    }
  }

  async function handleGoogleLogin() {
    if (isLoading) return;
    setLoadingProvider("google");
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const error = err as GoogleSignInError;
      if (error.type === "cancelled") return;
      if (error.type === "play_services_unavailable") {
        Alert.alert("로그인 실패", "Google Play 서비스를 사용할 수 없습니다.");
      } else if (error.type === "invalid_token") {
        Alert.alert("로그인 실패", "구글 인증이 만료되었습니다. 다시 시도해주세요.");
      } else {
        Alert.alert("오류", "로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1 px-8 pt-16">
        <Text className="text-6xl">🚂</Text>

        <Text className="mt-6 text-3xl font-bold text-gray-900 leading-10">
          트레일러를{"\n"}처음 이용해보시나요?
        </Text>

        <Text className="mt-5 text-base text-gray-500 leading-7">
          트레일러는 사용자의 기차여행을 계획부터 기록까지 함께하는 스마트 여행
          동반자 서비스입니다. 기차로 떠나는 모든 여정을 더욱 풍요롭게
          만들어드립니다.
        </Text>
      </View>

      <View className="px-8 pb-4">
        <TouchableOpacity
          className="w-full rounded-2xl py-4 items-center flex-row justify-center"
          style={{ backgroundColor: "#FEE500" }}
          onPress={handleKakaoLogin}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          {loadingProvider === "kakao" ? (
            <ActivityIndicator color="#3C1E1E" size="small" />
          ) : (
            <Text className="text-base font-semibold" style={{ color: "#3C1E1E" }}>
              카카오 로그인하기
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full rounded-2xl py-4 items-center flex-row justify-center mt-3 border border-gray-200"
          style={{ backgroundColor: "#FFFFFF" }}
          onPress={handleGoogleLogin}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          {loadingProvider === "google" ? (
            <ActivityIndicator color="#1F1F1F" size="small" />
          ) : (
            <Text className="text-base font-semibold" style={{ color: "#1F1F1F" }}>
              구글 로그인하기
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
