import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { useMyProfile } from "@/src/features/user/queries";
import { ProviderIcon } from "@/src/features/user/social-icon";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

export default function SocialAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile } = useMyProfile();

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View
          className="flex-row items-center"
          style={{
            ...headerBarStyle(insets.top),
            paddingHorizontal: scale(16),
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={{ padding: scale(4) }}
          >
            <BackIcon width={moderateScale(12)} height={moderateScale(17)} />
          </Pressable>
          <Text
            className="font-bold text-gray-900"
            style={{ fontSize: moderateScale(17), marginLeft: scale(8) }}
          >
            연동된 소셜 계정
          </Text>
        </View>

        {/* 본문 */}
        <View style={{ paddingHorizontal: scale(20), marginTop: verticalScale(12) }}>
          <Text
            className="text-gray-500"
            style={{ fontSize: moderateScale(13), marginBottom: verticalScale(10) }}
          >
            소셜 계정
          </Text>

          {profile ? (
            <View
              className="flex-row items-center"
              style={{
                borderWidth: 1,
                borderColor: "#ECECEC",
                borderRadius: scale(12),
                paddingHorizontal: scale(16),
                paddingVertical: verticalScale(16),
                gap: scale(14),
              }}
            >
              <ProviderIcon provider={profile.provider} size={moderateScale(26)} />
              <Text
                className="text-gray-800"
                numberOfLines={1}
                style={{ flex: 1, fontSize: moderateScale(15) }}
              >
                {profile.email ?? ""}
              </Text>
              {/* 대표 계정 배지 — 현재 가입 provider 1건이 대표 */}
              <View
                className="bg-gray-100"
                style={{
                  paddingHorizontal: scale(10),
                  paddingVertical: verticalScale(4),
                  borderRadius: scale(8),
                }}
              >
                <Text
                  className="text-gray-500"
                  style={{ fontSize: moderateScale(12) }}
                >
                  대표
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
