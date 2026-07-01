import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BellIcon from "@/src/components/icons/BellIcon";
import CalendarGridIcon from "@/src/components/icons/CalendarGridIcon";
import HomeIcon from "@/src/components/icons/HomeIcon";
import PersonIcon from "@/src/components/icons/PersonIcon";
import PlayIcon from "@/src/components/icons/PlayIcon";
import { moderateScale, verticalScale } from "@/src/utils/responsive";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // 하단바 글씨 제거 (아이콘만)
        tabBarActiveTintColor: "#668DFF",
        tabBarInactiveTintColor: "#9D9D9D",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          // 디자인상 바 높이 65 + 시스템 내비 인셋만큼 아래 여백 → 겹침 방지
          height: verticalScale(65) + insets.bottom,
          paddingTop: verticalScale(8),
          paddingBottom: insets.bottom + verticalScale(8),
        },
      }}
    >
      {/* 순서: 홈 · 피드(재생) · 캘린더(일정) · 알림 · 프로필  */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <HomeIcon
              color={color}
              width={moderateScale(22)}
              height={moderateScale(22)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ color }) => (
            <PlayIcon
              color={color}
              width={moderateScale(22)}
              height={moderateScale(22)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ color }) => (
            <CalendarGridIcon
              color={color}
              width={moderateScale(22)}
              height={moderateScale(22)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color }) => (
            <BellIcon
              color={color}
              width={moderateScale(20)}
              height={moderateScale(22)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => (
            <PersonIcon
              color={color}
              width={moderateScale(19)}
              height={moderateScale(21)}
            />
          ),
        }}
      />
    </Tabs>
  );
}
