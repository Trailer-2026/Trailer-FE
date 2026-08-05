import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import ForwardIcon from "@/src/components/icons/ForwardIcon";
import { Text } from "@/src/components/Text";
import { LEGAL_MENU } from "@/src/features/legal/documents";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

/** 약관 및 정책 목록 — 세 문서로의 진입점(> 로 상세로 이동). */
export default function TermsIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white">
      {/* 헤더 */}
      <View
        className="flex-row items-center"
        style={{
          paddingTop: insets.top + verticalScale(16),
          paddingHorizontal: scale(16),
          paddingBottom: verticalScale(6),
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
          약관 및 정책
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: verticalScale(8) }}
      >
        {LEGAL_MENU.map(({ kind, label }) => (
          <Pressable
            key={kind}
            onPress={() =>
              router.push({
                pathname: "/profile/terms/[kind]",
                params: { kind },
              })
            }
            android_ripple={{ color: "#F1F3F9" }}
            className="flex-row items-center justify-between"
            style={{
              paddingHorizontal: scale(20),
              height: verticalScale(56),
            }}
          >
            <Text
              className="text-gray-800"
              style={{ fontSize: moderateScale(15) }}
            >
              {label}
            </Text>
            <ForwardIcon
              width={moderateScale(8)}
              height={moderateScale(12)}
              color="#C4C9D4"
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
