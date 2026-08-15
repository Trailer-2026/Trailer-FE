import { router, Tabs, usePathname } from "expo-router";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BellIcon from "@/src/components/icons/BellIcon";
import CalendarGridIcon from "@/src/components/icons/CalendarGridIcon";
import HomeIcon from "@/src/components/icons/HomeIcon";
import PersonIcon from "@/src/components/icons/PersonIcon";
import PlayIcon from "@/src/components/icons/PlayIcon";
import { useUnreadNotificationCount } from "@/src/features/notification/queries";
import { useCurrentTravel } from "@/src/features/travel/queries";
import { moderateScale, verticalScale } from "@/src/utils/responsive";

// 릴스(피드) 탭은 풀스크린 영상 위라 하단바도 어둡게 뒤집는다.
const DARK_BAR_BG = "#0D0D0D";

/**
 * 앱 실행당 1회만 판단한다는 표시. 모듈 스코프라 앱을 완전히 껐다 켜야 초기화된다
 * — 여행중에 홈으로 돌아왔다고 해서 계속 '내 일정'으로 끌고 가지 않기 위함.
 */
let launchRedirectDecided = false;

/**
 * 앱을 켰을 때 여행중이면 홈 대신 '내 일정' 탭을 연다.
 * 그 화면이 다시 일정표 상세로 보내므로(calendar.tsx 의 ONGOING 자동 진입),
 * 결과적으로 진행 중인 여행 일정표가 첫 화면이 된다.
 *
 * 판단은 `GET /api/travels/current` **첫 응답 한 번**으로만 한다. 응답이 늦어
 * 그 사이 사용자가 다른 탭으로 옮겼다면 방해하지 않고 그대로 둔다.
 */
function useOpenOngoingTravelOnLaunch() {
  const { data: current } = useCurrentTravel();
  const pathname = usePathname();

  useEffect(() => {
    if (launchRedirectDecided) return;
    if (current === undefined) return; // 아직 조회 중
    launchRedirectDecided = true;
    if (current?.status !== "ONGOING") return;
    if (pathname !== "/") return; // 이미 다른 탭을 보고 있으면 두 번 옮기지 않는다
    router.navigate("/calendar");
  }, [current, pathname]);
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // 알림 탭 배지 — 목록 캐시(pages[0].unread_count)에 반응. 로그인 상태에서 이 레이아웃이
  // 마운트되면 자동으로 첫 페이지를 fetch 해 배지가 계산된다.
  const unreadCount = useUnreadNotificationCount();
  useOpenOngoingTravelOnLaunch();

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
