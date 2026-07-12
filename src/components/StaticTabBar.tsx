import { router, usePathname, type Href } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BellIcon from "@/src/components/icons/BellIcon";
import CalendarGridIcon from "@/src/components/icons/CalendarGridIcon";
import HomeIcon from "@/src/components/icons/HomeIcon";
import PersonIcon from "@/src/components/icons/PersonIcon";
import PlayIcon from "@/src/components/icons/PlayIcon";
import { moderateScale, verticalScale } from "@/src/utils/responsive";

/**
 * 탭 그룹 밖(스택) 화면에서도 하단 탭바를 그대로 보여주기 위한 정적 복제본.
 * (탭 레이아웃 app/(app)/(tabs)/_layout.tsx 과 순서·아이콘·색상 동일)
 * 탭 안 화면이 아니라 활성 표시는 없고, 탭 아이콘 누르면 해당 탭으로 이동한다.
 */
const TABS: { path: Href; Icon: typeof HomeIcon; w: number; h: number }[] = [
  { path: "/", Icon: HomeIcon, w: 22, h: 22 },
  { path: "/feed", Icon: PlayIcon, w: 22, h: 22 },
  { path: "/calendar", Icon: CalendarGridIcon, w: 22, h: 22 },
  { path: "/notifications", Icon: BellIcon, w: 20, h: 22 },
  { path: "/profile", Icon: PersonIcon, w: 19, h: 21 },
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
      {TABS.map(({ path, Icon, w, h }) => {
        const active = pathname === path;
        const color = active ? "#668DFF" : "#9D9D9D";
        return (
          <Pressable
            key={String(path)}
            onPress={() => router.navigate(path)}
            className="flex-1 items-center justify-center"
          >
            <Icon
              color={color}
              width={moderateScale(w)}
              height={moderateScale(h)}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
