import { useIsFocused } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { describeApiError } from "@/src/api/errors";
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
import { normalizeStationName } from "@/src/features/scenic/api";
import {
  SCENERY_BACKGROUNDS,
  SCENERY_CARD_HEIGHT,
  SCENERY_SCRIM,
  sceneryTimeSlot,
} from "@/src/features/scenic/background";
import { pickScenicPhoto } from "@/src/features/scenic/capture";
import { formatBasedAt, formatClockLabel } from "@/src/features/scenic/format";
import { useMinuteTick } from "@/src/features/scenic/queries";
import {
  findCurrentScheduleItem,
  findNearestScheduleItem,
} from "@/src/features/scenic/segments";
import { useScenicStore } from "@/src/features/scenic/store";
import type { NotificationLogItem } from "@/src/features/notification/types";
import {
  useAddTravelImages,
  useCurrentTravel,
  usePastTravels,
  useTravelDetail,
} from "@/src/features/travel/queries";
import { useMyProfile } from "@/src/features/user/queries";
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

  /**
   * 알림 탭에 들어오면 자동으로 전체 읽음 처리한다('모두 읽음' 버튼 대체).
   *
   * 화면이 포커스된 뒤에 목록이 도착하는 경우(첫 진입·콜드 스타트)도 있어서
   * 포커스 여부와 unreadCount 를 함께 본다 — 둘 중 뭐가 먼저 와도 한 번은 실행된다.
   *
   * 실패하면 다시 시도하지 않는다 — 낙관 업데이트가 롤백되며 unreadCount 가 되살아나
   * 그대로 두면 같은 요청을 무한 반복하게 된다. 탭을 나갔다 오면 다시 시도한다.
   */
  const isFocused = useIsFocused();
  const readAllFailed = useRef(false);
  useEffect(() => {
    if (!isFocused) {
      readAllFailed.current = false;
      return;
    }
    if (unreadCount === 0 || readAll.isPending || readAllFailed.current) return;
    readAll.mutate(undefined, {
      onError: () => {
        readAllFailed.current = true;
      },
    });
  }, [isFocused, unreadCount, readAll]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* 헤더 — 읽음 처리는 진입 시 자동이라 버튼이 없다. */}
      <View
        className="flex-row items-center"
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
/* 상단 풍경알림 카드                                                     */
/*                                                                     */
/* 시안(`알림` / `알림_` 프레임, 360x800)의 수치를 그대로 옮겼다.          */
/*   카드 높이 352(접으면 161) · 라벨 y+9 · 프로필 y+41 45x45 ·           */
/*   기준시각 y+87 · 촬영 버튼 y+279 318x48 r10                          */
/* 관광지 목록·구간·새로고침·탑승 종료 같은 조작은 이 카드에 두지 않는다.   */
/* ------------------------------------------------------------------ */
function SceneryPromoCard({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  // 방금 붙였다는 표시 — 버튼을 바꾸지 않고 위에 5초만 띄운다(시안은 버튼이 항상 촬영).
  const [justAdded, setJustAdded] = useState(false);
  const addImages = useAddTravelImages();

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 5000);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const profile = useMyProfile().data;
  const nickname = profile?.nickname ?? "여행자";
  const profileImage = profile?.profile_image ?? null;

  const session = useScenicStore((s) => s.session);
  const result = useScenicStore((s) => s.lastResponse);
  // 배경 시간대를 정하는 현재 시각 — 1분마다 갱신돼 시간대가 저절로 넘어간다.
  const now = useMinuteTick();
  const bg = SCENERY_BACKGROUNDS[sceneryTimeSlot(now)];

  // 열차를 타고 있지 않을 때 "지금 ○○ 일정 중" 을 띄우기 위한 진행 중 일정.
  // 여행중(ONGOING)이 아니면 조회하지 않는다.
  const { data: currentTravel } = useCurrentTravel();
  const { data: detail } = useTravelDetail(
    currentTravel?.status === "ONGOING" ? currentTravel.travel_idx : undefined,
  );
  const currentSchedule = useMemo(
    () => (detail && !session ? findCurrentScheduleItem(detail, now) : null),
    [detail, session, now],
  );
  const currentScheduleTitle = currentSchedule?.title?.trim() || null;

  /**
   * 좌표 없는 사진을 붙일 일정.
   *
   * 서버는 사진 GPS 로만 일정을 찾기 때문에, 메타데이터에 좌표가 없으면
   * schedule_idx 가 null 로 남는다(= 어느 일정에도 안 붙음). 그래서 앱이
   * 탑승 중 구간 → 진행 중 일정 → 시각이 가장 가까운 일정 순으로 골라 채워 보낸다.
   */
  const fallbackScheduleIdx =
    session?.scheduleIdx ??
    currentSchedule?.schedule_idx ??
    (detail ? (findNearestScheduleItem(detail, now)?.schedule_idx ?? null) : null);

  // 폴링은 AutoBoarding(앱 루트)이 건다 — 이 탭은 lazy mount 라 여기서 걸면
  // 사용자가 알림 탭을 열지 않는 동안 푸시가 나가지 않는다.

  const scrim = collapsed ? SCENERY_SCRIM.collapsed : SCENERY_SCRIM.expanded;
  // 탑승 중이면 그 여행, 아니면 진행 중인 여행에 사진을 붙인다.
  const photoTravelIdx = session?.travelIdx ?? currentTravel?.travel_idx ?? null;

  const onPickPhoto = async (source: MediaSource) => {
    setSheetOpen(false);
    // 붙일 일정을 정할 수 있으면 좌표가 없어도 받는다.
    const photo = await pickScenicPhoto(source, {
      requireLocation: fallbackScheduleIdx == null,
    });
    if (!photo) return; // 취소·권한 거부
    if (photoTravelIdx == null) {
      Alert.alert(
        "여행을 찾지 못했어요",
        "진행 중인 여행이 있을 때 사진을 붙일 수 있어요.",
      );
      return;
    }

    // 좌표가 있으면 서버가 GPS 로 정확히 매핑한다. 없을 때만 앱이 고른 일정을 붙인다
    // (안 보내면 schedule_idx 가 null 로 남아 어느 일정에도 안 붙는다).
    const hasLocation = photo.latitude != null && photo.longitude != null;
    addImages.mutate(
      {
        travelIdx: photoTravelIdx,
        photos: [photo],
        scheduleIdx: hasLocation ? null : fallbackScheduleIdx,
      },
      {
        onSuccess: () => setJustAdded(true),
        onError: (err) => Alert.alert("사진 등록 실패", describeApiError(err)),
      },
    );
  };

  return (
    <View
      className="overflow-hidden"
      style={{
        // 시안대로 화면 폭을 꽉 채운다(좌우 여백·라운드 없음).
        marginBottom: verticalScale(16),
        height: verticalScale(
          collapsed
            ? SCENERY_CARD_HEIGHT.collapsed
            : SCENERY_CARD_HEIGHT.expanded,
        ),
        // 일러스트가 뜨기 전 잠깐 보이는 색.
        backgroundColor: bg.fallback,
      }}
    >
      {/* 시간대별 배경 일러스트 — 접었을 때 위쪽이 남도록 top 기준으로 자른다. */}
      <Image
        source={bg.image}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="top"
        transition={200}
      />
      {/* 글씨가 묻히지 않게 위쪽만 덮는 흰 그라디언트(시안 값). */}
      <LinearGradient
        colors={[...scrim.colors]}
        locations={[...scrim.locations]}
        style={StyleSheet.absoluteFill}
      />

      {/* 접기 — 카드 위 9. 시안의 '풍경알림' 라벨·종 아이콘은 빼둔 상태. */}
      <View
        className="flex-row items-center justify-end"
        style={{
          marginTop: verticalScale(9),
          paddingHorizontal: scale(20),
          height: verticalScale(20),
        }}
      >
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          className="flex-row items-center"
          style={{ gap: scale(4) }}
        >
          <Text
            style={{
              fontSize: moderateScale(12),
              fontWeight: "600",
              color: bg.text,
            }}
          >
            {collapsed ? "펼치기" : "접기"}
          </Text>
          <Feather
            name={collapsed ? "chevron-up" : "chevron-down"}
            size={moderateScale(12)}
            color={bg.text}
          />
        </Pressable>
      </View>

      {/* 프로필 + 인사 — 카드 위 41 */}
      <View
        className="flex-row"
        style={{ marginTop: verticalScale(12), paddingHorizontal: scale(17) }}
      >
        {/* 프로필 사진이 없는 계정(profile_image=null)이면 빈 흰 원만 남아
            깨진 것처럼 보여서, 내 정보 화면과 같은 사람 아이콘으로 채운다. */}
        <View
          className="bg-white rounded-full overflow-hidden items-center justify-center"
          style={{ width: scale(45), height: scale(45) }}
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <Feather name="user" size={scale(22)} color="#B7C0DA" />
          )}
        </View>
        <View style={{ flex: 1, marginLeft: scale(7) }}>
          <Text
            style={{
              fontSize: moderateScale(18),
              lineHeight: moderateScale(21),
              color: bg.text,
            }}
          >
            {nickname} 님,
          </Text>
          <Text
            style={{
              fontSize: moderateScale(18),
              lineHeight: moderateScale(21),
              color: bg.text,
            }}
          >
            {session ? (
              /* 일정표의 도착역(arr_station)이라 탑승 내내 바뀌지 않는다.
                 "지나가고 있어요" 로 쓰면 사실과 달라서 '향하고 있어요' 로 둔다.
                 normalizeStationName 이 항상 '역'으로 끝내주므로 조사는 '으로' 고정. */
              <>
                지금{" "}
                <Text style={{ fontWeight: "700" }}>
                  {normalizeStationName(session.toStation)}
                </Text>
                으로 향하고 있어요
              </>
            ) : currentScheduleTitle ? (
              <>
                지금{" "}
                <Text style={{ fontWeight: "700" }}>{currentScheduleTitle}</Text>{" "}
                일정 중이에요
              </>
            ) : (
              <>
                기차 창밖으로 보이는{" "}
                <Text style={{ fontWeight: "700" }}>풍경</Text>을 실시간으로
                알려드려요
              </>
            )}
          </Text>
          {/* 탑승 중이면 서버 조회 시각, 아니면 지금 시각(1분마다 갱신).
              탑승 직후 아직 조회 전이면 이 줄을 아예 그리지 않는다. */}
          {!session || result?.based_at ? (
            <Text
              style={{
                fontSize: moderateScale(12),
                lineHeight: moderateScale(14),
                marginTop: verticalScale(4),
                color: bg.subText,
              }}
            >
              {session && result?.based_at
                ? `${formatBasedAt(result.based_at)} 기준`
                : `${formatClockLabel(now)} 기준`}
            </Text>
          ) : null}
        </View>
      </View>

      {/* 촬영 버튼 — 카드 아래에서 25 띄운 자리(시안 y+279, 높이 48).
          접었을 때는 자리가 없어 그리지 않는다. */}
      {!collapsed ? (
        <View
          style={{
            position: "absolute",
            left: scale(20),
            right: scale(20),
            bottom: verticalScale(25),
            gap: verticalScale(8),
          }}
        >
          {/* 방금 붙였다는 알림 — 버튼 위에 5초만 떴다 사라진다. */}
          {justAdded ? (
            <View
              className="flex-row items-center bg-white"
              style={{
                alignSelf: "flex-start",
                borderRadius: 999,
                paddingHorizontal: scale(12),
                paddingVertical: verticalScale(6),
                gap: scale(6),
              }}
            >
              <Feather name="check" size={moderateScale(12)} color={ACCENT} />
              <Text
                className="font-semibold"
                style={{ fontSize: moderateScale(12), color: "#353535" }}
              >
                사진을 붙였어요
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => setSheetOpen(true)}
            disabled={addImages.isPending}
            className="items-center justify-center active:opacity-80"
            style={{
              height: verticalScale(48),
              borderRadius: scale(10),
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
                className="text-white"
                style={{ fontSize: moderateScale(16), fontWeight: "600" }}
              >
                지금 촬영하러 가기
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}

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
