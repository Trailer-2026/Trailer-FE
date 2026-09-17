import { router, usePathname, type Href } from "expo-router";
import type { ComponentType } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BellIcon from "@/src/components/icons/BellIcon";
import CalendarGridIcon from "@/src/components/icons/CalendarGridIcon";
import HomeIcon from "@/src/components/icons/HomeIcon";
import PersonIcon from "@/src/components/icons/PersonIcon";
import PlayIcon from "@/src/components/icons/PlayIcon";
import { Text } from "@/src/components/Text";
import { moderateScale, verticalScale } from "@/src/utils/responsive";

/**
 * 탭 그룹 밖(스택) 화면에서도 하단 탭바를 그대로 보여주기 위한 정적 복제본.
 * (탭 레이아웃 app/(app)/(tabs)/_layout.tsx 과 순서·아이콘·색상 동일)
 * 탭 안 화면이 아니라 활성 표시는 없고, 탭 아이콘 누르면 해당 탭으로 이동한다.
 */
// 아이콘마다 추가 prop(filled 등)이 달라서 typeof HomeIcon 으로 고정하지 않고,
// 여기서 실제로 넘기는 prop 만으로 타입을 잡는다.
type TabIcon = ComponentType<{
  color?: string;
  filled?: boolean;
  width?: number;
  height?: number;
}>;

const TABS: { path: Href; Icon: TabIcon; label: string; w: number; h: number }[] = [
  { path: "/", Icon: HomeIcon, label: "홈", w: 22, h: 22 },
  { path: "/feed", Icon: PlayIcon, label: "Shorts", w: 22, h: 22 },
  { path: "/calendar", Icon: CalendarGridIcon, label: "일정", w: 22, h: 22 },
  { path: "/notifications", Icon: BellIcon, label: "알림", w: 20, h: 22 },
  { path: "/profile", Icon: PersonIcon, label: "내 페이지", w: 19, h: 21 },
];

export function StaticTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  return (
    <View
      className="flex-row"
      style={{
        backgroundColor: "#FFFFFF",
        borderTopColor: "#E5E7EB",
        borderTopWidth: 1,
        height: verticalScale(65) + insets.bottom,
        paddingTop: verticalScale(8),
        paddingBottom: insets.bottom + verticalScale(8),
      }}
    >
      {TABS.map(({ path, Icon, label, w, h }) => {
        const active = pathname === path;
        const color = active ? "#1A1A1A" : "#9D9D9D";
        return (
          <Pressable
            key={String(path)}
            onPress={() => router.navigate(path)}
            className="flex-1 items-center justify-center"
          >
            <Icon
              color={color}
              filled={active}
              width={moderateScale(w)}
              height={moderateScale(h)}
            />
            <Text
              style={{
                color,
                fontWeight: active ? "600" : "400",
                fontSize: moderateScale(10),
                marginTop: verticalScale(4),
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
