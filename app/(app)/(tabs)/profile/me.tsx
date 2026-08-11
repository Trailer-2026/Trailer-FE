import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import EditPencilIcon from "@/src/components/icons/EditPencilIcon";
import ForwardIcon from "@/src/components/icons/ForwardIcon";
import { Text } from "@/src/components/Text";
import { pickProfileImage } from "@/src/features/user/image";
import { useMyProfile, useUpdateProfileImage } from "@/src/features/user/queries";
import { ProviderIcon } from "@/src/features/user/social-icon";
import { HEADER_HEIGHT } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const HEADER_BG = "#EDF0FB";

export default function MyProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: profile } = useMyProfile();
  const updateImage = useUpdateProfileImage();
  const uploading = updateImage.isPending;

  async function handleEditImage() {
    try {
      const file = await pickProfileImage();
      if (!file) return; // 취소
      await updateImage.mutateAsync(file);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      Alert.alert(
        "사진 변경 실패",
        status === 400
          ? "이미지 파일(jpg/png/webp, 10MB 이하)만 올릴 수 있어요."
          : "잠시 후 다시 시도해 주세요.",
      );
    }
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 라벤더 헤더 — 뒤로가기 + 타이틀 + 중앙 아바타 */}
        <View
          style={{
            backgroundColor: HEADER_BG,
            paddingTop: insets.top + verticalScale(6),
            paddingBottom: verticalScale(28),
          }}
        >
          {/* 뒤로+제목 줄 — 다른 화면 상단바와 같은 높이(44)에 세로 중앙. */}
          <View style={{ height: HEADER_HEIGHT, justifyContent: "center" }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="flex-row items-center"
              style={{ paddingHorizontal: scale(12) }}
            >
              <BackIcon width={moderateScale(12)} height={moderateScale(17)} />
              <Text
                className="text-gray-900"
                style={{
                  fontSize: moderateScale(17),
                  marginLeft: scale(10),
                  fontWeight: 650 as never,
                }}
              >
                내 프로필
              </Text>
            </Pressable>
          </View>

          {/* 중앙 아바타 (연필 배지 → 사진 편집) */}
          <View className="items-center" style={{ marginTop: verticalScale(16) }}>
            <Pressable onPress={handleEditImage} disabled={uploading}>
              <View
                className="bg-white rounded-full items-center justify-center overflow-hidden"
                style={{ width: scale(110), height: scale(110) }}
              >
                {profile?.profile_image ? (
                  <Image
                    source={{ uri: profile.profile_image }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : (
                  <Feather name="user" size={moderateScale(50)} color="#B7C0DA" />
                )}
                {uploading ? (
                  <View
                    className="absolute inset-0 items-center justify-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
                  >
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                ) : null}
              </View>

              {/* 연필 배지 */}
              <View
                className="absolute bg-white items-center justify-center rounded-full"
                style={{
                  right: scale(2),
                  bottom: scale(2),
                  width: scale(32),
                  height: scale(32),
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  elevation: 2,
                  shadowColor: "#000",
                }}
              >
                <EditPencilIcon
                  width={moderateScale(15)}
                  height={moderateScale(15)}
                />
              </View>
            </Pressable>
          </View>
        </View>

        {/* 상세 항목 */}
        <View style={{ paddingHorizontal: scale(20) }}>
          <DetailRow
            label="닉네임"
            value={profile?.nickname ?? ""}
            onPress={() => router.push("/profile/nickname")}
          />
          <DetailRow label="이메일" value={profile?.email ?? ""} muted />
          <DetailRow
            label="연동된 소셜 계정"
            right={
              profile ? (
                <ProviderIcon
                  provider={profile.provider}
                  size={moderateScale(22)}
                />
              ) : null
            }
            onPress={() => router.push("/profile/social")}
            last
          />
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 상세 항목 행                                                        */
/*   value: 오른쪽 회색 텍스트 / right: 오른쪽 커스텀(아이콘 등)         */
/*   onPress 있으면 > 표시. muted 는 편집 불가(이메일).                  */
/* ------------------------------------------------------------------ */
function DetailRow({
  label,
  value,
  right,
  onPress,
  muted,
  last,
}: {
  label: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  muted?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between"
      style={{
        height: verticalScale(60),
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: "#EFEFEF",
      }}
    >
      <Text
        className="font-bold text-gray-900"
        style={{ fontSize: moderateScale(15) }}
      >
        {label}
      </Text>
      <View className="flex-row items-center" style={{ gap: scale(6), flexShrink: 1 }}>
        {value ? (
          <Text
            className={muted ? "text-gray-400" : "text-gray-500"}
            numberOfLines={1}
            style={{ fontSize: moderateScale(15), textAlign: "right" }}
          >
            {value}
          </Text>
        ) : null}
        {right}
        {onPress ? (
          <ForwardIcon
            width={moderateScale(9)}
            height={moderateScale(14)}
            color="#C4C9D4"
          />
        ) : null}
      </View>
    </Pressable>
  );
}
