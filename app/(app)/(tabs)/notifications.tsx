import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BellIcon from "@/src/components/icons/BellIcon";
import { Text } from "@/src/components/Text";
import {
  useNotifications,
  useReadAllNotifications,
  useReadNotification,
} from "@/src/features/notification/queries";
import type { NotificationLogItem } from "@/src/features/notification/types";
import {
  useCurrentTravel,
  usePastTravels,
} from "@/src/features/travel/queries";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";
// 알림 카드 우측 썸네일 대체 이미지(여행 커버 미확보 시).
const COVER_FALLBACK = require("../../../assets/images/Main.png");

/** ISO 문자열 → "방금 전" / "N분 전" / "N시간 전" / "M/D". */
function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const min = Math.floor((Date.now() - t) / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}일 전`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function NotificationsTab() {
  const [collapsed, setCollapsed] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();
  const readOne = useReadNotification();
  const readAll = useReadAllNotifications();

  // 페이지들을 한 배열로 평탄화.
  const items = useMemo<NotificationLogItem[]>(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );
  const unreadCount = data?.pages[0]?.unread_count ?? 0;

  // 여행 커버 이미지 조회용 — 알림 스펙엔 cover 가 없어 현재/과거 여행 캐시로 룩업.
  // 둘 다 다른 탭에서 이미 자주 부르는 쿼리라 대부분 캐시 hit, 첫 방문에도 1회 fetch 로 끝.
  // TODO(backend): NotificationLogItem 에 cover_image_url 이 추가되면 이 룩업 제거.
  const { data: currentTravel } = useCurrentTravel();
  const { data: pastTravels } = usePastTravels();
  const coverByIdx = useMemo(() => {
    const m = new Map<number, string | null>();
    if (currentTravel) m.set(currentTravel.travel_idx, currentTravel.cover_image_url);
    for (const t of pastTravels?.travels ?? []) {
      m.set(t.travel_idx, t.cover_image_url);
    }
    return m;
  }, [currentTravel, pastTravels]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onItemPress = useCallback(
    (item: NotificationLogItem) => {
      if (!item.is_read) readOne.mutate(item.notification_log_idx);
      // 삭제 알림은 원본 여행이 사라졌으니 상세로 갈 수 없다 → AI 일정 생성 진입점으로.
      // type enum 이 서버 스펙에 명시돼 있지 않아 대소문자·표기 변형에 안전하게 substring 매칭.
      if (item.type.toUpperCase().includes("DELETE")) {
        router.push("/course/intro");
        return;
      }
      if (item.travel_idx != null) {
        router.push({
          pathname: "/travel/[travelIdx]",
          params: { travelIdx: item.travel_idx },
        });
      }
    },
    [readOne],
  );

  const onReadAll = useCallback(() => {
    if (unreadCount === 0) return;
    readAll.mutate(undefined, {
      onError: () =>
        Alert.alert("알림", "전체 읽음 처리에 실패했어요. 다시 시도해 주세요."),
    });
  }, [unreadCount, readAll]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* 헤더 */}
      <View
        className="flex-row items-center justify-between"
        style={{
          paddingHorizontal: scale(20),
          height: verticalScale(44),
        }}
      >
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(20) }}
        >
          알림
        </Text>
        <Pressable
          onPress={onReadAll}
          disabled={unreadCount === 0 || readAll.isPending}
          hitSlop={8}
          className="active:opacity-60"
        >
          <Text
            style={{
              fontSize: moderateScale(13),
              color: unreadCount === 0 ? "#C4C4C4" : ACCENT,
            }}
          >
            모두 읽음
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.notification_log_idx)}
        renderItem={({ item }) => (
          <NotificationCard
            item={item}
            coverUrl={
              item.travel_idx != null
                ? coverByIdx.get(item.travel_idx) ?? null
                : null
            }
            onPress={() => onItemPress(item)}
          />
        )}
        ListHeaderComponent={
          <SceneryPromoCard
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View
              className="items-center"
              style={{ paddingTop: verticalScale(60) }}
            >
              <ActivityIndicator color={ACCENT} />
            </View>
          ) : isError ? (
            <View
              className="items-center"
              style={{ paddingTop: verticalScale(60) }}
            >
              <Text
                className="text-gray-400"
                style={{ fontSize: moderateScale(14) }}
              >
                알림을 불러오지 못했어요
              </Text>
              <Pressable
                onPress={() => refetch()}
                className="active:opacity-60"
                style={{ marginTop: verticalScale(10) }}
              >
                <Text style={{ color: ACCENT, fontSize: moderateScale(13) }}>
                  다시 시도
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              className="items-center"
              style={{ paddingTop: verticalScale(60) }}
            >
              <Text
                className="text-gray-400"
                style={{ fontSize: moderateScale(14) }}
              >
                받은 알림이 없어요
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: verticalScale(16) }}>
              <ActivityIndicator color={ACCENT} />
            </View>
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor={ACCENT}
            colors={[ACCENT]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: verticalScale(24) }}
      />
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* 상단 풍경알림 프로모 카드                                             */
/* 실시간 풍경 알림(GET /api/scenic-spots/nearby) 은 이번 범위 밖 —      */
/* 이 카드는 자리 유지용 정적 UI(TODO: 실 데이터 연결).                   */
/* ------------------------------------------------------------------ */
function SceneryPromoCard({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <View
      className="overflow-hidden"
      style={{
        marginHorizontal: scale(20),
        marginTop: verticalScale(8),
        // 아래 알림 목록과 붙지 않게 여백 확보.
        marginBottom: verticalScale(16),
        borderRadius: scale(16),
        backgroundColor: "#F2DEE8",
      }}
    >
      <View style={{ padding: scale(16) }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center" style={{ gap: scale(6) }}>
            <BellIcon
              color={ACCENT}
              width={moderateScale(18)}
              height={moderateScale(20)}
            />
            <Text
              className="font-bold"
              style={{ fontSize: moderateScale(15), color: ACCENT }}
            >
              풍경알림
            </Text>
          </View>
          <Pressable onPress={onToggle} hitSlop={8}>
            <Text
              className="text-gray-500"
              style={{ fontSize: moderateScale(13) }}
            >
              {collapsed ? "펼치기" : "접기"}
            </Text>
          </Pressable>
        </View>

        {!collapsed ? (
          <>
            <View
              className="flex-row"
              style={{ marginTop: verticalScale(14) }}
            >
              <View
                className="bg-white rounded-full"
                style={{ width: scale(48), height: scale(48) }}
              />
              <View style={{ flex: 1, marginLeft: scale(12) }}>
                <Text
                  className="text-gray-900"
                  style={{ fontSize: moderateScale(16) }}
                >
                  김이박 님,
                </Text>
                <Text
                  className="text-gray-900"
                  style={{
                    fontSize: moderateScale(16),
                    marginTop: verticalScale(2),
                    lineHeight: moderateScale(23),
                  }}
                >
                  지금 <Text className="font-bold">대전역</Text> 스팟을 지나고
                  있어요
                </Text>
                <Text
                  className="text-gray-400"
                  style={{
                    fontSize: moderateScale(12),
                    marginTop: verticalScale(4),
                  }}
                >
                  오전 9:00 기준
                </Text>
              </View>
            </View>
            <View style={{ height: verticalScale(140) }} />
            <Pressable
              className="items-center justify-center rounded-2xl"
              style={{
                height: verticalScale(56),
                backgroundColor: ACCENT,
              }}
            >
              <Text
                className="text-white font-bold"
                style={{ fontSize: moderateScale(16) }}
              >
                지금 촬영하러 가기
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 알림 1건 카드                                                        */
/* ------------------------------------------------------------------ */
function NotificationCard({
  item,
  coverUrl,
  onPress,
}: {
  item: NotificationLogItem;
  /** 연결된 여행의 커버 이미지 URL. null 이면 fallback 이미지 사용. */
  coverUrl: string | null;
  onPress: () => void;
}) {
  const unread = !item.is_read;
  // 여행에 연결된 알림(담기·D-1 등) 에는 우측에 대표 사진 썸네일을 붙인다.
  // 삭제 알림은 원본이 사라져 캐시에서 커버를 못 꺼내므로(백엔드가 cover_image_url 을
  // 넣어주기 전까지) 아예 썸네일 자체를 빼서 fallback 이미지도 안 뜨게 한다.
  const isDelete = item.type.toUpperCase().includes("DELETE");
  const showThumb = item.travel_idx != null && !isDelete;
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center active:opacity-70"
      style={{
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(14),
        gap: scale(12),
        // 미읽음: 살짝 파란 배경으로 강조 + 왼쪽 컬러 도트
        backgroundColor: unread ? "#EEF2FF" : "transparent",
      }}
    >
      {/* 미읽음 도트 (읽음이면 자리만 유지) */}
      <View
        style={{
          width: scale(8),
          height: scale(8),
          borderRadius: scale(4),
          backgroundColor: unread ? ACCENT : "transparent",
          alignSelf: "flex-start",
          marginTop: verticalScale(6),
        }}
      />

      <View style={{ flex: 1 }}>
        <Text
          className={unread ? "font-bold text-gray-900" : "text-gray-900"}
          style={{
            fontSize: moderateScale(14),
            lineHeight: moderateScale(20),
          }}
          numberOfLines={3}
        >
          {item.body}
        </Text>
        <Text
          className="text-gray-400"
          style={{
            fontSize: moderateScale(12),
            marginTop: verticalScale(4),
          }}
        >
          {relativeTime(item.created_at)}
        </Text>
      </View>

      {showThumb ? (
        <Image
          source={coverUrl ? { uri: coverUrl } : COVER_FALLBACK}
          contentFit="cover"
          style={{
            width: scale(56),
            height: scale(56),
            borderRadius: scale(8),
            backgroundColor: "#E5E7EB",
          }}
        />
      ) : null}
    </Pressable>
  );
}
