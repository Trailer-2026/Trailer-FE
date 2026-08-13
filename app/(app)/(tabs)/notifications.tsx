import { Image } from "expo-image";
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

import { describeApiError } from "@/src/api/errors";
import BellIcon from "@/src/components/icons/BellIcon";
import { Text } from "@/src/components/Text";
import {
  useNotifications,
  useReadAllNotifications,
  useReadNotification,
} from "@/src/features/notification/queries";
import { openNotificationTarget } from "@/src/features/notification/routing";
import MediaSourceSheet, {
  type MediaSource,
} from "@/src/features/reels/components/MediaSourceSheet";
import type { ReelsMediaAsset } from "@/src/features/reels/types";
import { pickScenicPhoto } from "@/src/features/scenic/capture";
import { useScenicStore } from "@/src/features/scenic/store";
import type { NotificationLogItem } from "@/src/features/notification/types";
import {
  useAddTravelImages,
  useCurrentTravel,
  usePastTravels,
} from "@/src/features/travel/queries";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";

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
  // 풍경 알림은 탑승 중일 때 오는 것이라, 사진도 그 여행에 붙인다.
  const ridingTravelIdx = useScenicStore((s) => s.session?.travelIdx ?? null);
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
      // 이동 규칙은 푸시 탭과 공유한다(routing.ts).
      openNotificationTarget({ type: item.type, travelIdx: item.travel_idx });
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
          // 앱 전체 상단바와 같은 높이로 맞추기 위한 여백.
          marginTop: verticalScale(6),
          height: verticalScale(44),
        }}
      >
        <Text
          className="text-gray-900"
          style={{ fontSize: moderateScale(20), fontWeight: 650 as never }}
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
            // 탑승 중이면 그 여행, 아니면 진행 중인 여행에 사진을 붙인다.
            travelIdx={ridingTravelIdx ?? currentTravel?.travel_idx ?? null}
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
  travelIdx,
}: {
  collapsed: boolean;
  onToggle: () => void;
  /** 사진을 붙일 여행. 탑승 세션이 없으면 진행 중인 여행으로 떨어진다. */
  travelIdx: number | null;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  // 방금 붙인 사진 — 성공을 시스템 알림창 대신 카드 안에서 보여준다.
  const [added, setAdded] = useState<ReelsMediaAsset | null>(null);
  const addImages = useAddTravelImages();

  const onPickPhoto = async (source: MediaSource) => {
    setSheetOpen(false);
    const photo = await pickScenicPhoto(source);
    if (!photo) return; // 취소·권한 거부
    if (travelIdx == null) {
      Alert.alert("여행을 찾지 못했어요", "진행 중인 여행이 있을 때 사진을 붙일 수 있어요.");
      return;
    }
    // schedule_idx 는 보내지 않는다 — 서버가 사진 EXIF 의 GPS 로 가까운 일정에 매핑한다.
    addImages.mutate(
      { travelIdx, photos: [photo] },
      {
        onSuccess: () => setAdded(photo),
        onError: (err) => Alert.alert("사진 등록 실패", describeApiError(err)),
      },
    );
  };

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
            {added ? (
              /* 방금 붙인 사진 — 썸네일 + 안내. 누르면 한 장 더 붙일 수 있다. */
              <Pressable
                onPress={() => setSheetOpen(true)}
                className="flex-row items-center rounded-2xl bg-white active:opacity-80"
                style={{
                  height: verticalScale(56),
                  paddingHorizontal: scale(12),
                  gap: scale(12),
                }}
                accessibilityRole="button"
                accessibilityLabel="사진 한 장 더 붙이기"
              >
                <Image
                  source={{ uri: added.uri }}
                  style={{
                    width: scale(38),
                    height: scale(38),
                    borderRadius: scale(8),
                  }}
                  contentFit="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text
                    className="font-bold"
                    style={{ fontSize: moderateScale(14), color: "#353535" }}
                  >
                    사진을 붙였어요
                  </Text>
                  <Text
                    className="text-gray-500"
                    numberOfLines={1}
                    style={{
                      fontSize: moderateScale(12),
                      marginTop: verticalScale(2),
                    }}
                  >
                    여행 영상을 만들 때 함께 담겨요
                  </Text>
                </View>
                <Text
                  className="font-semibold"
                  style={{ fontSize: moderateScale(13), color: ACCENT }}
                >
                  한 장 더
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setSheetOpen(true)}
                disabled={addImages.isPending}
                className="items-center justify-center rounded-2xl active:opacity-80"
                style={{
                  height: verticalScale(56),
                  backgroundColor: ACCENT,
                  opacity: addImages.isPending ? 0.6 : 1,
                }}
                accessibilityRole="button"
                accessibilityLabel="지금 촬영하러 가기"
              >
                {addImages.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text
                    className="text-white font-bold"
                    style={{ fontSize: moderateScale(16) }}
                  >
                    지금 촬영하러 가기
                  </Text>
                )}
              </Pressable>
            )}
          </>
        ) : null}
      </View>

      {/* 촬영하기 / 갤러리에서 선택 — 영상 만들기와 같은 시트를 그대로 쓴다. */}
      <MediaSourceSheet
        visible={sheetOpen}
        onSelect={onPickPhoto}
        onClose={() => setSheetOpen(false)}
      />
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
  // 캐시에서 실제 커버 URL 을 꺼낸 경우에만 썸네일을 그린다.
  // - 담기·D-1 알림: current/past 캐시에 여행이 있어 URL 이 잡힘 → 실제 사진 표시.
  // - 삭제 알림: 소프트 삭제된 여행은 두 캐시 어디에도 없어 URL=null → 썸네일 자체 미표시.
  //   (type enum 이 서버 스펙에 확정 표기가 없어 substring 매칭에 의존하지 않고, 커버 유무로 판단.)
  const showThumb = coverUrl != null;
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
      {/*
        도트 + 본문을 한 묶음으로 감싼다.
        바깥 행은 items-center 라 썸네일이 있으면 행 높이가 텍스트보다 커지는데,
        도트를 바깥 행에 직접 두면 행 기준 위쪽에 붙어 첫 줄과 어긋난다.
        이 래퍼의 높이는 항상 본문 높이와 같으므로, 썸네일 유무와 무관하게
        도트가 첫 줄에 정렬된다.
      */}
      <View className="flex-row" style={{ flex: 1, gap: scale(12) }}>
        {/* 미읽음 도트 (읽음이면 자리만 유지) — 첫 줄 가운데에 맞춘다. */}
        <View
          style={{
            width: scale(8),
            height: scale(8),
            borderRadius: scale(4),
            backgroundColor: unread ? ACCENT : "transparent",
            alignSelf: "flex-start",
            // (첫 줄 lineHeight 20 - 도트 8) / 2
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
      </View>

      {showThumb ? (
        <Image
          source={{ uri: coverUrl! }}
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
