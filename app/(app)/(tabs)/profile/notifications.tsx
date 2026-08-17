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
import {
  useNotificationSettingsQuery,
  useUpdateNotificationSettings,
} from "@/src/features/notification/queries";
import type { NotificationUpdateRequest } from "@/src/features/notification/types";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#668DFF";

/**
 * 알림 설정 화면. 세 항목 모두 GET/PATCH /api/users/me/notifications 에 직결된다 —
 * '이벤트 및 마케팅 알림' → event_alarm, '이벤트 및 마케팅 활용동의' → marketing_agree,
 * '기차역 풍경 알림' → scenery_alarm.
 *
 * 개인정보 마케팅 활용 동의는 광고성 정보 수신의 전제라, 이 동의가 꺼져 있으면
 * '이벤트 및 마케팅 알림' 토글을 잠그고 동의를 내리면 알림도 함께 끈다.
 */
export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: settings, isLoading } = useNotificationSettingsQuery();
  const update = useUpdateNotificationSettings();

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
   * 이벤트 알림도 함께 끈다.
   *
   * 두 필드를 한 번의 PATCH 로 보낸다 — 따로 부르면 앞 요청이 실패했을 때
   * 동의는 꺼졌는데 알림은 켜진 채로 남는다.
   */
  const onConsentChange = (value: boolean) => {
    onToggle(
      !value && settings?.event_alarm
        ? { marketing_agree: false, event_alarm: false }
        : { marketing_agree: value },
    );
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
          className="text-gray-900"
style={{
            fontSize: moderateScale(17),
            marginLeft: scale(8),
            fontWeight: 650 as never,
          }}
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
              settings.marketing_agree
                ? "새로운 이벤트 및 마케팅 알림을 드립니다"
                : "아래 활용동의를 먼저 켜주세요"
            }
            value={settings.event_alarm && settings.marketing_agree}
            disabled={!settings.marketing_agree}
            onChange={(v) => onToggle({ event_alarm: v })}
          />
          {/*
            '이벤트 및 마케팅 활용동의' — 개인정보를 마케팅 목적으로 이용하는 데 대한 동의로,
            광고성 정보 수신(위 항목)의 전제다. 알림 수신과 달리 선택 동의라 기본값이 false.
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
            value={settings.marketing_agree}
            onChange={onConsentChange}
          />
          {/*
            '기차역 풍경 알림'. 서버가 GET /api/scenic-spots/nearby 응답과 함께 푸시를
            쏘는데, 그 발송을 가르는 스위치가 이 값이다. 앱이 임의로 끄지 않고
            사용자 선택만 반영한다.
            TODO: 자동 탑승(AutoBoarding)이 아직 이 값을 보지 않는다 — 꺼져 있으면
                  세션을 시작하지 않도록 이어서 연결할 것.
          */}
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
