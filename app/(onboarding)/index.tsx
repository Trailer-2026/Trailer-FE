import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthBottomSheet } from "@/src/components/AuthBottomSheet";
import { Text } from "@/src/components/Text";
import {
  GoogleSignInError,
  signInWithGoogle,
} from "@/src/features/auth/sign-in-google";
import {
  KakaoSignInError,
  signInWithKakao,
} from "@/src/features/auth/sign-in-kakao";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const { width: SCREEN_W } = Dimensions.get("window");

// 구글 로고 (풀컬러 96×96).
const ICON_GOOGLE = require("../../assets/images/style/google.png");

type Provider = "kakao" | "google";
type Sheet = "none" | "signup" | "login";

// 온보딩 슬라이드.
const SLIDES: {
  key: string;
  title: string;
  subtitle: string;
  image: number;
}[] = [
  {
    key: "ai",
    title: "AI 기차 일정 추천",
    subtitle: "AI가 가장 효율적인 일정을 추천해요",
    image: require("../../assets/images/style/login1.png"),
  },
  {
    key: "scenery",
    title: "기차 풍경 알림",
    subtitle: "놓치기 아까운 풍경을 미리 알려드려요",
    image: require("../../assets/images/style/login2.png"),
  },
  {
    key: "video",
    title: "여행 영상 제작",
    subtitle: "여행의 순간을 하나의 영상으로 담아드려요.",
    image: require("../../assets/images/style/login3.png"),
  },
];

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const [sheet, setSheet] = useState<Sheet>("none");
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const isLoading = loadingProvider !== null;
  const scrollRef = useRef<ScrollView>(null);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setPage(Math.max(0, Math.min(SLIDES.length - 1, i)));
  };

  async function handleKakaoLogin() {
    if (isLoading) return;
    setLoadingProvider("kakao");
    try {
      await signInWithKakao();
      // 성공 시 루트 가드가 자동으로 (app) 으로 리다이렉트.
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
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      {/* 슬라이드 캐러셀 */}
      <View className="flex-1">
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
        >
          {SLIDES.map((slide) => (
            <View
              key={slide.key}
              style={{
                width: SCREEN_W,
                flex: 1,
                alignItems: "center",
                justifyContent: "flex-start",
                paddingTop: verticalScale(80),
                paddingHorizontal: scale(32),
              }}
            >
              {/* 일러스트 (영상 제작 슬라이드만 살짝 크게) */}
              <Image
                source={slide.image}
                resizeMode="contain"
                style={
                  slide.key === "video"
                    ? { width: scale(296), height: scale(254) }
                    : { width: scale(280), height: scale(240) }
                }
              />

              <Text
                className="font-bold text-gray-900 text-center"
                style={{
                  fontSize: moderateScale(22),
                  // 영상 슬라이드는 이미지가 scale(14) 만큼 더 커서, 글씨 위치를
                  // 다른 슬라이드와 맞추기 위해 그만큼 위로 당긴다.
                  marginTop:
                    slide.key === "video"
                      ? verticalScale(32) - scale(14)
                      : verticalScale(32),
                }}
              >
                {slide.title}
              </Text>
              <Text
                className="text-gray-900 font-medium text-center"
                style={{
                  fontSize: moderateScale(15),
                  marginTop: verticalScale(10),
                }}
              >
                {slide.subtitle}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 하단 고정 영역: 도트 + 시작하기 + 로그인 링크 */}
      <View style={{ paddingHorizontal: scale(24), paddingBottom: verticalScale(20) }}>
        <View
          className="flex-row items-center justify-center"
          style={{ gap: scale(6), marginBottom: verticalScale(20) }}
        >
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              style={{
                width: i === page ? scale(7) : scale(6),
                height: i === page ? scale(7) : scale(6),
                borderRadius: 999,
                backgroundColor: i === page ? "#111827" : "#D9DCE1",
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={() => setSheet("signup")}
          className="w-full items-center justify-center rounded-2xl"
          style={{ height: verticalScale(54), backgroundColor: "#7292EE" }}
        >
          <Text
            className="text-white font-semibold"
            style={{ fontSize: moderateScale(16) }}
          >
            시작하기
          </Text>
        </Pressable>

        <View
          className="flex-row items-center justify-center"
          style={{ marginTop: verticalScale(16), gap: scale(4) }}
        >
          <Text
            className="text-gray-400 font-medium"
            style={{ fontSize: moderateScale(13) }}
          >
            이미 계정이 있나요?
          </Text>
          <Pressable onPress={() => setSheet("login")} hitSlop={8}>
            <Text
              className="font-bold"
              style={{ fontSize: moderateScale(13), color: "#5E84F4" }}
            >
              로그인
            </Text>
          </Pressable>
        </View>
      </View>
      </SafeAreaView>

      {/* 회원가입 바텀시트 */}
      <AuthBottomSheet
        visible={sheet === "signup"}
        onClose={() => setSheet("none")}
        title="회원가입하기"
        subtitle="소셜 로그인으로 가입할 수 있어요."
      >
        <GoogleButton
          label="Google로 시작하기"
          loading={loadingProvider === "google"}
          disabled={isLoading}
          onPress={handleGoogleLogin}
        />
        <View style={{ height: verticalScale(12) }} />
        <KakaoButton
          label="카카오로 시작하기"
          loading={loadingProvider === "kakao"}
          disabled={isLoading}
          onPress={handleKakaoLogin}
        />
        <SheetFooter
          question="이미 계정이 있나요?"
          action="로그인"
          onPress={() => setSheet("login")}
        />
      </AuthBottomSheet>

      {/* 로그인 바텀시트 */}
      <AuthBottomSheet
        visible={sheet === "login"}
        onClose={() => setSheet("none")}
        title="로그인 방법 선택"
        subtitle="소셜 계정으로 빠르게 로그인하세요."
      >
        <GoogleButton
          label="Google로 계속하기"
          loading={loadingProvider === "google"}
          disabled={isLoading}
          onPress={handleGoogleLogin}
        />
        <View style={{ height: verticalScale(12) }} />
        <KakaoButton
          label="카카오로 계속하기"
          loading={loadingProvider === "kakao"}
          disabled={isLoading}
          onPress={handleKakaoLogin}
        />
        <SheetFooter
          question="아직 계정이 없나요?"
          action="회원가입"
          onPress={() => setSheet("signup")}
        />
      </AuthBottomSheet>
    </View>
  );
}

function KakaoButton({
  label,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="w-full items-center justify-center rounded-2xl"
      style={{ height: verticalScale(54), backgroundColor: "#F5D73F" }}
    >
      {loading ? (
        <ActivityIndicator color="#3C1E1E" size="small" />
      ) : (
        <>
          <MaterialCommunityIcons
            name="chat"
            size={moderateScale(24)}
            color="#3C1E1E"
            style={{ position: "absolute", left: scale(18) }}
          />
          <Text
            className="font-semibold"
            style={{ fontSize: moderateScale(16), color: "#3C1E1E" }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

function GoogleButton({
  label,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="w-full items-center justify-center rounded-2xl border"
      style={{
        height: verticalScale(54),
        backgroundColor: "#FFFFFF",
        borderColor: "#E5E7EB",
      }}
    >
      {loading ? (
        <ActivityIndicator color="#1F1F1F" size="small" />
      ) : (
        <>
          <Image
            source={ICON_GOOGLE}
            resizeMode="contain"
            style={{
              position: "absolute",
              left: scale(18),
              width: moderateScale(24),
              height: moderateScale(24),
            }}
          />
          <Text
            className="font-semibold text-gray-800"
            style={{ fontSize: moderateScale(16) }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

function SheetFooter({
  question,
  action,
  onPress,
}: {
  question: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View
      className="flex-row items-center justify-center"
      style={{ marginTop: verticalScale(16), gap: scale(4) }}
    >
      <Text
        className="text-gray-400 font-medium"
        style={{ fontSize: moderateScale(13) }}
      >
        {question}
      </Text>
      <Pressable onPress={onPress} hitSlop={8}>
        <Text
          className="font-bold"
          style={{ fontSize: moderateScale(13), color: "#5E84F4" }}
        >
          {action}
        </Text>
      </Pressable>
    </View>
  );
}
