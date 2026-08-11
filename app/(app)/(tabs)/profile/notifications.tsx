import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { useMarketingConsent } from "@/src/features/notification/marketing-consent";
import {
  useNotificationSettingsQuery,
  useUpdateNotificationSettings,
} from "@/src/features/notification/queries";
import type { NotificationUpdateRequest } from "@/src/features/notification/types";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#668DFF";

/**
 * 알림 설정 화면.
 * - '이벤트 및 마케팅 알림' → event_alarm, '기차역 풍경 알림' → scenery_alarm 서버 연결.
 * - '이벤트 및 마케팅 활용동의' 는 대응 API 필드가 없어 기기 로컬에 저장한다(marketing-consent.ts).
 *   개인정보 마케팅 활용 동의는 광고성 정보 수신의 전제라, 이 동의가 꺼져 있으면
 *   '이벤트 및 마케팅 알림' 토글을 잠그고 동의를 내리면 알림도 함께 끈다.
 */
export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: settings, isLoading } = useNotificationSettingsQuery();
  const update = useUpdateNotificationSettings();

  const { consent, setConsent } = useMarketingConsent(settings?.event_alarm);

  /** 낙관적 토글 — 뒤집힌 항목 하나만 서버에 보낸다(다른 필드 덮어쓰기 방지). */
  const onToggle = (patch: NotificationUpdateRequest) => {
    update.mutate(patch, {
      onError: () => {
        // 캐시는 훅에서 이미 롤백된다 — 안내만.
        Alert.alert("알림 설정", "변경에 실패했어요. 잠시 후 다시 시도해 주세요.");
      },
    });
  };

  /**
   * 활용동의 전환. 동의를 철회하면 광고성 정보를 계속 보낼 근거가 사라지므로
   * 이벤트 알림도 함께 끈다(서버에도 반영).
   */
  const onConsentChange = (value: boolean) => {
    setConsent(value);
    if (!value && settings?.event_alarm) onToggle({ event_alarm: false });
  };

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
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(17), marginLeft: scale(8) }}
        >
          알림 설정
        </Text>
      </View>

      {isLoading || !settings ? (
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
          {/* 광고성 정보 수신 — 활용동의가 있어야 켤 수 있다. */}
          <ToggleRow
            title="이벤트 및 마케팅 알림"
            subtitle={
              consent
                ? "새로운 이벤트 및 마케팅 알림을 드립니다"
                : "아래 활용동의를 먼저 켜주세요"
            }
            value={settings.event_alarm && consent === true}
            disabled={!consent}
            onChange={(v) => onToggle({ event_alarm: v })}
          />
          {/*
            '이벤트 및 마케팅 활용동의' — 개인정보를 마케팅 목적으로 이용하는 데 대한 동의로,
            광고성 정보 수신(위 항목)의 전제다. 서버에 대응 필드가 없어 기기 로컬에 저장한다.
            TODO(backend): 알림 설정 API 에 필드가 추가되면 로컬 저장을 그쪽으로 옮길 것.
          */}
          <ToggleRow
            title="이벤트 및 마케팅 활용동의"
            subtitle={
              <Pressable
                hitSlop={6}
                onPress={() =>
                  router.push({
                    pathname: "/profile/terms/[kind]",
                    params: { kind: "marketing" },
                  })
                }
              >
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
            value={consent === true}
            onChange={onConsentChange}
          />
          <ToggleRow
            title="기차역 풍경 알림"
            subtitle="기차 이동 중 풍경을 알림으로 안내합니다"
            value={settings.scenery_alarm}
            onChange={(v) => onToggle({ scenery_alarm: v })}
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
  disabled = false,
}: {
  title: string;
  subtitle: React.ReactNode;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between"
      style={{ paddingVertical: verticalScale(16), gap: scale(12) }}
    >
      <View style={{ flex: 1, opacity: disabled ? 0.5 : 1 }}>
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
        disabled={disabled}
        trackColor={{ false: "#D1D5DB", true: ACCENT }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
