import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BellIcon from "@/src/components/icons/BellIcon";
import CalendarGridIcon from "@/src/components/icons/CalendarGridIcon";
import HomeIcon from "@/src/components/icons/HomeIcon";
import PersonIcon from "@/src/components/icons/PersonIcon";
import PlayIcon from "@/src/components/icons/PlayIcon";
import { useUnreadNotificationCount } from "@/src/features/notification/queries";
import { moderateScale, verticalScale } from "@/src/utils/responsive";

// 릴스(피드) 탭은 풀스크린 영상 위라 하단바도 어둡게 뒤집는다.
const DARK_BAR_BG = "#0D0D0D";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // 알림 탭 배지 — 목록 캐시(pages[0].unread_count)에 반응. 로그인 상태에서 이 레이아웃이
  // 마운트되면 자동으로 첫 페이지를 fetch 해 배지가 계산된다.
  const unreadCount = useUnreadNotificationCount();

  // 배경색만 다르고 치수는 공통 — 라이트/다크 두 벌에서 재사용
  const tabBarMetrics = {
    // 디자인상 바 높이 65 + 시스템 내비 인셋만큼 아래 여백 → 겹침 방지
    height: verticalScale(65) + insets.bottom,
    paddingTop: verticalScale(8),
    paddingBottom: insets.bottom + verticalScale(8),
  };

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
          ...tabBarMetrics,
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
          // 이 탭이 포커스된 동안에만 적용 → 릴스 화면에서만 하단바가 어두워진다.
          tabBarStyle: {
            backgroundColor: DARK_BAR_BG,
            borderTopColor: DARK_BAR_BG,
            ...tabBarMetrics,
          },
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#9D9D9D",
          tabBarIcon: ({ color, focused }) => (
            <PlayIcon
              color={color}
              filled={focused} // 활성 시 흰색으로 꽉 채우고 재생 삼각형만 뚫기
              holeColor={DARK_BAR_BG}
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
          // 99+ 로 캡. 0 이면 undefined 로 빼서 dot/숫자 표시 자체를 숨긴다.
          tabBarBadge:
            unreadCount > 0
              ? unreadCount > 99
                ? "99+"
                : unreadCount
              : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#FF3B30",
            color: "#FFFFFF",
            fontSize: moderateScale(10),
            minWidth: moderateScale(16),
            height: moderateScale(16),
            lineHeight: moderateScale(16),
          },
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
