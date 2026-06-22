import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { signInWithKakao, KakaoSignInError } from "@/src/features/auth/sign-in-kakao";
import { signInWithGoogle, GoogleSignInError } from "@/src/features/auth/sign-in-google";

type Provider = "kakao" | "google";

export default function LoginScreen() {
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-20 items-center">
          <Text className="text-5xl font-bold text-gray-900 mb-3">Trailer</Text>
          <Text className="text-base text-gray-400">영화를 더 재미있게</Text>
        </View>

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
              카카오로 시작하기
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
              구글로 시작하기
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
