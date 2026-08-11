import Feather from "@expo/vector-icons/Feather";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Alert, ImageBackground, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AlarmIcon from "@/src/components/icons/AlarmIcon";
import BookmarkIcon from "@/src/components/icons/BookmarkIcon";
import ForwardIcon from "@/src/components/icons/ForwardIcon";
import InfoIcon from "@/src/components/icons/InfoIcon";
import LogoutIcon from "@/src/components/icons/LogoutIcon";
import TermsIcon from "@/src/components/icons/TermsIcon";
import { Text } from "@/src/components/Text";
import { deleteAccount, logout } from "@/src/features/auth/api";
import { describeAuthError } from "@/src/features/auth/errors";
import { getRefreshToken } from "@/src/features/auth/storage";
import { useAuthStore } from "@/src/features/auth/store";
import { useMyProfile } from "@/src/features/user/queries";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const HEADER_BG = "#EDF0FB";
const MENU_ICON = "#5E5E5E";

const MY_BG = require("../../../../assets/images/style/my_background.png");
const RECORD_ICON = require("../../../../assets/images/style/travel-record.png");
const STAMP_ICON = require("../../../../assets/images/style/stamp.png");
const VIDEO_ICON = require("../../../../assets/images/style/video.png");

type MenuRow = {
  key: string;
  label: string;
  icon: React.ReactNode;
  right?: string;
  onPress?: () => void;
};

export default function ProfileTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const clear = useAuthStore((s) => s.clear);
  const { data: profile, isLoading } = useMyProfile();

  /**
   * 로컬 세션 종료 — 토큰 삭제 + 서버 응답 캐시 비우기.
   * 캐시를 비우지 않으면 다른 계정으로 다시 로그인했을 때 이전 사용자의 프로필·여행이
   * 잠깐 그대로 보인다(react-query 캐시는 토큰과 무관하게 남는다).
   */
  async function endSession() {
    await clear();
    queryClient.clear();
  }

  async function handleLogout() {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) await logout(refreshToken);
    } catch {
      // 서버 로그아웃 실패해도 로컬 토큰은 삭제
    } finally {
      await endSession();
    }
  }

  function confirmLogout() {
    Alert.alert("로그아웃", "계정에서 로그아웃할까요?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: handleLogout },
    ]);
  }

  async function handleWithdraw() {
    try {
      await deleteAccount();
    } catch (e) {
      // 탈퇴가 실패했으면 로그인 상태를 유지해야 한다(로컬만 지우면 유령 계정이 남는다).
      Alert.alert("탈퇴 실패", describeAuthError(e));
      return;
    }
    // 서버가 refresh·FCM 토큰을 이미 정리했으므로 로컬 세션만 끝내면 된다.
    await endSession();
  }

  function confirmWithdraw() {
    Alert.alert(
      "정말 탈퇴할까요?",
      "여행 일정, 사진, 알림 설정이 모두 삭제되고 되돌릴 수 없어요.\n같은 계정으로 다시 가입하면 새 계정으로 시작돼요.",
      [
        { text: "취소", style: "cancel" },
        { text: "탈퇴하기", style: "destructive", onPress: handleWithdraw },
      ],
    );
  }

  const nickname = profile?.nickname ?? (isLoading ? "불러오는 중…" : "게스트");
  const email = profile?.email ?? "";

  const menu: MenuRow[] = [
    {
      key: "bookmark",
      label: "북마크",
      icon: (
        <BookmarkIcon
          width={moderateScale(14)}
          height={moderateScale(20)}
          color={MENU_ICON}
        />
      ),
    },
  ];
  const menu2: MenuRow[] = [
    {
      key: "notifications",
      label: "알림 설정",
      icon: (
        <AlarmIcon
          width={moderateScale(24)}
          height={moderateScale(24)}
          color={MENU_ICON}
        />
      ),
      onPress: () => router.push("/profile/notifications"),
    },
    {
      key: "terms",
      label: "약관 및 정책",
      icon: (
        <TermsIcon
          width={moderateScale(24)}
          height={moderateScale(24)}
          color={MENU_ICON}
        />
      ),
      onPress: () => router.push("/profile/terms"),
    },
    {
      key: "version",
      label: "버전 정보",
      icon: (
        <InfoIcon
          width={moderateScale(24)}
          height={moderateScale(24)}
          color={MENU_ICON}
        />
      ),
      onPress: () => router.push("/profile/version"),
    },
    {
      key: "logout",
      label: "로그아웃",
      icon: (
        <LogoutIcon
          width={moderateScale(24)}
          height={moderateScale(24)}
          color={MENU_ICON}
        />
      ),
      onPress: confirmLogout,
    },
    {
      key: "withdraw",
      label: "회원 탈퇴",
      icon: (
        <Feather name="user-x" size={moderateScale(22)} color={MENU_ICON} />
      ),
      onPress: confirmWithdraw,
    },
  ];

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 라벤더 헤더 (배경 이미지) — 프로필 요약 + 3분할 카드 */}
        <ImageBackground
          source={MY_BG}
          resizeMode="cover"
          style={{
            backgroundColor: HEADER_BG,
            paddingTop: insets.top + verticalScale(28),
            paddingHorizontal: scale(20),
            paddingBottom: verticalScale(20),
          }}
        >
          {/* 프로필 요약 행 — 탭하면 내 프로필 상세로 */}
          <Pressable
            onPress={() => router.push("/profile/me")}
            className="flex-row items-center"
            style={{ gap: scale(14) }}
          >
            <Avatar uri={profile?.profile_image ?? null} size={scale(70)} />
            <View style={{ flex: 1 }}>
              <Text
                className="font-bold text-gray-900"
                numberOfLines={1}
                style={{ fontSize: moderateScale(18) }}
              >
                {nickname}
              </Text>
              {email ? (
                <Text
                  className="text-gray-400"
                  numberOfLines={1}
                  style={{
                    fontSize: moderateScale(13),
                    marginTop: verticalScale(3),
                  }}
                >
                  {email}
                </Text>
              ) : null}
            </View>
            <ForwardIcon
              width={moderateScale(10)}
              height={moderateScale(15)}
              color="#9CA3AF"
            />
          </Pressable>

          {/* 3분할 카드: 여행기록 · 스탬프 · 내 영상 */}
          <View
            className="bg-white flex-row"
            style={{
              width: scale(320),
              height: verticalScale(94),
              alignSelf: "center",
              marginTop: verticalScale(18),
              borderRadius: scale(16),
              elevation: 2,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            }}
          >
            <StatCol
              label="여행기록"
              icon={
                <Image
                  source={RECORD_ICON}
                  style={{ width: moderateScale(32), height: moderateScale(32) }}
                  contentFit="contain"
                />
              }
              onPress={() => router.push("/profile/travels")}
            />
            <ColDivider />
            <StatCol
              label="스탬프"
              icon={
                <Image
                  source={STAMP_ICON}
                  style={{ width: moderateScale(32), height: moderateScale(32) }}
                  contentFit="contain"
                />
              }
              onPress={() => router.push("/profile/stamps")}
            />
            <ColDivider />
            <StatCol
              label="내 영상"
              icon={
                <Image
                  source={VIDEO_ICON}
                  style={{ width: moderateScale(32), height: moderateScale(32) }}
                  contentFit="contain"
                />
              }
            />
          </View>
        </ImageBackground>

        {/* 메뉴: 북마크 */}
        <View style={{ paddingTop: verticalScale(8) }}>
          {menu.map((row) => (
            <MenuItem key={row.key} row={row} />
          ))}
        </View>

        {/* 구분 여백 */}
        <View style={{ height: verticalScale(8), backgroundColor: "#F3F4F6" }} />

        {/* 메뉴: 알림/약관/버전/계정 */}
        <View>
          {menu2.map((row) => (
            <MenuItem key={row.key} row={row} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 아바타 (연필 배지) — index 에선 배지 표시만, 실제 편집은 상세 화면에서 */
/* ------------------------------------------------------------------ */
function Avatar({ uri, size }: { uri: string | null; size: number }) {
  return (
    <View
      className="bg-white rounded-full items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      ) : (
        <Feather name="user" size={size * 0.5} color="#B7C0DA" />
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 3분할 카드 컬럼                                                      */
/* ------------------------------------------------------------------ */
function StatCol({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="items-center justify-center"
      style={{ flex: 1, gap: verticalScale(8) }}
    >
      {icon}
      <Text
        className="text-gray-700"
        style={{ fontSize: moderateScale(13), fontWeight: 600 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ColDivider() {
  return (
    <View
      style={{
        width: 1,
        backgroundColor: "#EAEAEA",
        marginVertical: verticalScale(4),
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* 메뉴 행                                                             */
/* ------------------------------------------------------------------ */
function MenuItem({ row }: { row: MenuRow }) {
  return (
    <Pressable
      onPress={row.onPress}
      disabled={!row.onPress}
      android_ripple={{ color: "#F1F3F9" }}
      className="flex-row items-center justify-between"
      style={{
        paddingHorizontal: scale(20),
        height: verticalScale(56),
      }}
    >
      <View className="flex-row items-center" style={{ gap: scale(14) }}>
        <View style={{ width: moderateScale(26), alignItems: "center" }}>
          {row.icon}
        </View>
        <Text
          className="text-gray-800"
          style={{ fontSize: moderateScale(15), fontWeight: 600 }}
        >
          {row.label}
        </Text>
      </View>
      <View className="flex-row items-center" style={{ gap: scale(8) }}>
        {row.right ? (
          <Text
            className="text-gray-400"
            style={{ fontSize: moderateScale(13) }}
          >
            {row.right}
          </Text>
        ) : null}
        <ForwardIcon
          width={moderateScale(8)}
          height={moderateScale(12)}
          color="#C4C9D4"
        />
      </View>
    </Pressable>
  );
}
