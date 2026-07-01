import Feather from "@expo/vector-icons/Feather";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { getMe, logout } from "@/src/features/auth/api";
import { getRefreshToken } from "@/src/features/auth/storage";
import { useAuthStore } from "@/src/features/auth/store";
import type { UserProfile } from "@/src/features/auth/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const PROVIDER_KO: Record<UserProfile["provider"], string> = {
  google: "구글",
  kakao: "카카오",
};

// /api/auth/me 에는 없는 값 — 추후 별도 API 연동 시 교체
const STATS = [
  { key: "trips", label: "여행기록", value: 0 },
  { key: "stamps", label: "스탬프", value: 0 },
  { key: "videos", label: "내 영상", value: 0 },
];

export default function ProfileTab() {
  const clear = useAuthStore((s) => s.clear);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const me = await getMe();
        if (active) setUser(me);
      } catch {
        // 401 이면 인터셉터가 refresh/로그아웃 처리 → 가드가 온보딩으로 이동
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) await logout(refreshToken);
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

  const displayName = user
    ? user.email ?? `${PROVIDER_KO[user.provider]} 사용자`
    : loading
      ? "불러오는 중…"
      : "게스트";

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 상단 라벤더 섹션: 아바타 + 이름 + 통계 카드 */}
        <View
          style={{
            backgroundColor: "#EEF1FB",
            paddingHorizontal: scale(20),
            paddingTop: verticalScale(20),
            paddingBottom: verticalScale(24),
          }}
        >
          {/* 아바타 + 이름 */}
          <View className="flex-row items-center" style={{ gap: scale(20) }}>
            <View
              className="bg-white rounded-full"
              style={{ width: scale(96), height: scale(96) }}
            />
            <View style={{ flex: 1 }}>
              {loading ? (
                <ActivityIndicator color="#5E84F4" />
              ) : (
                <>
                  <Text
                    className="font-bold text-gray-900"
                    numberOfLines={1}
                    style={{ fontSize: moderateScale(22) }}
                  >
                    {displayName}
                  </Text>
                  {user ? (
                    <Text
                      className="text-gray-400"
                      style={{
                        fontSize: moderateScale(13),
                        marginTop: verticalScale(4),
                      }}
                    >
                      {PROVIDER_KO[user.provider]} 계정
                    </Text>
                  ) : error ? (
                    <Text
                      className="text-gray-400"
                      style={{
                        fontSize: moderateScale(13),
                        marginTop: verticalScale(4),
                      }}
                    >
                      정보를 불러오지 못했어요
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          </View>

          {/* 통계 카드 */}
          <View
            className="bg-white flex-row"
            style={{
              marginTop: verticalScale(24),
              borderRadius: scale(16),
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {STATS.map((stat, i) => (
              <View key={stat.key} className="flex-row" style={{ flex: 1 }}>
                {i > 0 ? (
                  <View
                    style={{
                      width: 1,
                      backgroundColor: "#EAEAEA",
                      marginVertical: verticalScale(22),
                    }}
                  />
                ) : null}
                <View
                  className="items-center justify-between"
                  style={{
                    flex: 1,
                    height: verticalScale(120),
                    paddingVertical: verticalScale(22),
                  }}
                >
                  <Text
                    className="font-bold text-gray-900"
                    style={{ fontSize: moderateScale(18) }}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    className="text-gray-500"
                    style={{ fontSize: moderateScale(13) }}
                  >
                    {stat.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 우측 화살표 (사진과 동일) */}
        <View
          style={{
            paddingHorizontal: scale(20),
            paddingVertical: verticalScale(16),
            alignItems: "flex-end",
          }}
        >
          <Pressable hitSlop={8}>
            <Feather
              name="chevron-right"
              size={moderateScale(24)}
              color="#9CA3AF"
            />
          </Pressable>
        </View>

        {/* 로그아웃 (테스트용 유지 — 디자인엔 없음) */}
        <View style={{ alignItems: "center", marginTop: verticalScale(40) }}>
          <Pressable onPress={confirmLogout} hitSlop={8}>
            <Text
              className="text-gray-400"
              style={{ fontSize: moderateScale(13) }}
            >
              로그아웃
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
