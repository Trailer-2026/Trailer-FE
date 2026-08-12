import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

export default function VersionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const version = Constants.expoConfig?.version ?? "1.0.0";
  // 최신 버전 조회 API 가 없어 현재 버전과 동일하게 표시(항상 최신).
  const latest = version;
  const isLatest = version === latest;

  return (
    <View className="flex-1 bg-white">
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
          className="text-gray-900"
style={{
            fontSize: moderateScale(17),
            marginLeft: scale(8),
            fontWeight: 650 as never,
          }}
        >
          버전 정보
        </Text>
      </View>

      {/* 본문 (연회색 배경, 세로 중앙) */}
      <View
        className="items-center justify-center"
        style={{ flex: 1, backgroundColor: "#F4F4F6" }}
      >
        <Text
          className="font-bold text-gray-800"
          style={{ fontSize: moderateScale(16) }}
        >
          {isLatest ? "최신 버전을 사용중입니다." : "새 버전이 있어요."}
        </Text>

        <View
          className="flex-row items-center"
          style={{ marginTop: verticalScale(24), gap: scale(16) }}
        >
          {/* 앱 아이콘 자리 (파란 라운드 사각형) */}
          <View
            style={{
              width: scale(56),
              height: scale(56),
              borderRadius: scale(12),
              backgroundColor: "#5E84F4",
            }}
          />

          <View style={{ gap: verticalScale(6) }}>
            <VersionRow label="현재 버전" value={version} />
            <VersionRow label="최신 버전" value={latest} />
          </View>
        </View>
      </View>
    </View>
  );
}

function VersionRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row" style={{ gap: scale(20) }}>
      <Text className="text-gray-500" style={{ fontSize: moderateScale(14) }}>
        {label}
      </Text>
      <Text className="text-gray-500" style={{ fontSize: moderateScale(14) }}>
        {value}
      </Text>
    </View>
  );
}
