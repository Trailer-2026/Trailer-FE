import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { usePushBannerStore } from "../banner-store";
import { openNotificationTarget } from "../routing";

const ACCENT = "#5E84F4";

/**
 * 포그라운드 푸시 배너 — (app) 레이아웃에 항상 마운트.
 *
 * 배너가 없으면 아무것도 그리지 않는다. 탭하면 알림함·푸시 탭과 같은 규칙으로
 * 이동하고(routing.ts) 배너를 닫는다. ✕ 는 이동 없이 닫기만 한다.
 *
 * 렌더 완료 배너(video/RenderTracker)와 같은 위치·모양이다. 둘이 동시에 뜨면
 * 겹치지만, 렌더 완료와 푸시가 같은 순간에 오는 경우는 드물어 우선순위를 두지 않았다.
 */
export default function PushBanner() {
  const banner = usePushBannerStore((s) => s.banner);
  const dismiss = usePushBannerStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();

  if (!banner) return null;

  const scenery = (banner.target.type ?? "").toUpperCase().includes("SCENERY");

  const onPress = () => {
    dismiss();
    openNotificationTarget(banner.target);
  };

  return (
    <View
      className="absolute inset-x-0"
      style={{ top: insets.top + verticalScale(8), paddingHorizontal: scale(16) }}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        className="flex-row items-center active:opacity-90"
        style={{
          backgroundColor: "#1C1C1C",
          borderRadius: scale(14),
          borderWidth: 1,
          borderColor: ACCENT,
          paddingVertical: verticalScale(12),
          paddingHorizontal: scale(14),
          gap: scale(12),
          // NativeWind shadow-* 는 안드로이드에서 흐릿해 elevation 을 직접 준다.
          elevation: 8,
          shadowColor: "#000000",
        }}
        accessibilityRole="button"
        accessibilityLabel={`${banner.title}. 탭하여 보기`}
      >
        <Text style={{ fontSize: moderateScale(20) }}>{scenery ? "🚆" : "🔔"}</Text>

        <View className="flex-1">
          <Text
            className="font-semibold text-white"
            style={{ fontSize: moderateScale(14) }}
            numberOfLines={1}
          >
            {banner.title}
          </Text>
          {banner.body ? (
            <Text
              className="text-gray-400"
              style={{ fontSize: moderateScale(12), marginTop: verticalScale(2) }}
              numberOfLines={2}
            >
              {banner.body}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={dismiss}
          hitSlop={12}
          className="active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="알림 닫기"
        >
          <Text className="text-gray-500" style={{ fontSize: moderateScale(18) }}>
            ✕
          </Text>
        </Pressable>
      </Pressable>
    </View>
  );
}
