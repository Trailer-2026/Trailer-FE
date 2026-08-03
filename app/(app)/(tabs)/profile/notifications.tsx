import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { useNotificationSettings } from "@/src/features/notification/settings-store";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#668DFF";

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const hydrated = useNotificationSettings((s) => s.hydrated);
  const hydrate = useNotificationSettings((s) => s.hydrate);
  const marketing = useNotificationSettings((s) => s.marketing);
  const marketingConsent = useNotificationSettings((s) => s.marketingConsent);
  const scenery = useNotificationSettings((s) => s.scenery);
  const setSetting = useNotificationSettings((s) => s.setSetting);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
          알림 설정
        </Text>
      </View>

      {!hydrated ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: scale(20),
            paddingTop: verticalScale(16),
          }}
        >
          <ToggleRow
            title="이벤트 및 마케팅 알림"
            subtitle="새로운 이벤트 및 마케팅 알림을 드립니다"
            value={marketing}
            onChange={(v) => setSetting("marketing", v)}
          />
          <ToggleRow
            title="이벤트 및 마케팅 활용동의"
            subtitle={
              <Pressable hitSlop={6} onPress={() => { /* TODO: 동의항목 화면 */ }}>
                <Text
                  className="text-gray-400"
                  style={{
                    fontSize: moderateScale(13),
                    textDecorationLine: "underline",
                  }}
                >
                  동의항목 보기
                </Text>
              </Pressable>
            }
            value={marketingConsent}
            onChange={(v) => setSetting("marketingConsent", v)}
          />
          <ToggleRow
            title="기차역 풍경 알림"
            subtitle="기차 이동 중 풍경을 알림으로 안내합니다"
            value={scenery}
            onChange={(v) => setSetting("scenery", v)}
          />
        </ScrollView>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 토글 한 줄 (제목 + 설명/링크 + 스위치)                                 */
/* ------------------------------------------------------------------ */
function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: React.ReactNode;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View
      className="flex-row items-center justify-between"
      style={{ paddingVertical: verticalScale(16), gap: scale(12) }}
    >
      <View style={{ flex: 1 }}>
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(16) }}
        >
          {title}
        </Text>
        <View style={{ marginTop: verticalScale(4) }}>
          {typeof subtitle === "string" ? (
            <Text
              className="text-gray-400"
              style={{ fontSize: moderateScale(13) }}
            >
              {subtitle}
            </Text>
          ) : (
            subtitle
          )}
        </View>
      </View>

      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#D1D5DB", true: ACCENT }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
