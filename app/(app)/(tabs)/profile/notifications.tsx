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
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#668DFF";

/**
 * 알림 설정 화면.
 * - '이벤트 및 마케팅 알림' → event_alarm, '기차역 풍경 알림' → scenery_alarm 서버 연결.
 * - '이벤트 및 마케팅 활용동의' 는 대응 API 필드가 없어 자리만 만들고 비활성 처리(스펙 확정 전 임의 필드 전송 금지).
 *   TODO(backend): 마케팅 활용동의 필드가 추가되면 여기서 실 필드명으로 갈아끼운다.
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
          <ToggleRow
            title="이벤트 및 마케팅 알림"
            subtitle="새로운 이벤트 및 마케팅 알림을 드립니다"
            value={settings.event_alarm}
            onChange={(v) => onToggle({ event_alarm: v })}
          />
          {/*
            '이벤트 및 마케팅 활용동의' — 대응 API 필드 없음.
            TODO(backend): 마케팅 활용동의 필드 확정 후 이 자리에 연결.
            임의 필드명으로 전송 금지(스펙 미확정 상태에서 요청 보내면 무시되거나 400).
          */}
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
            value={false}
            disabled
            onChange={() => {}}
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
          {disabled ? (
            <Text
              className="text-gray-400"
              style={{
                fontSize: moderateScale(12),
                marginTop: verticalScale(2),
              }}
            >
              준비 중
            </Text>
          ) : null}
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
