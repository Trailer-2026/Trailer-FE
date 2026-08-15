import { useIsFocused } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
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
import BellFilledIcon from "@/src/components/icons/BellFilledIcon";
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
import { normalizeStationName } from "@/src/features/scenic/api";
import {
  SCENERY_BACKGROUNDS,
  sceneryTimeSlot,
  type SceneryBackground,
} from "@/src/features/scenic/background";
import { pickScenicPhoto } from "@/src/features/scenic/capture";
import SpotCard from "@/src/features/scenic/components/SpotCard";
import { formatBasedAt, formatClockLabel } from "@/src/features/scenic/format";
import {
  ensureForegroundLocationPermission,
  hasForegroundLocationPermission,
} from "@/src/features/scenic/location";
import { useMinuteTick, useScenicPolling } from "@/src/features/scenic/queries";
import { useScenicStore, type ScenicSession } from "@/src/features/scenic/store";
import type { NotificationLogItem } from "@/src/features/notification/types";
import {
  useAddTravelImages,
  useCurrentTravel,
  usePastTravels,
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
/* 상단 풍경알림 카드 — 이 기능의 주 화면                                 */
/*                                                                     */
/* 두 가지 상태를 그린다.                                                */
/*  - 탑승 전: 안내 문구 + 현재 시각 + '실제 위치 켜기'(위치 권한 요청)    */
/*  - 탑승 중: 지나는 역 + 조회 기준 시각 + 관광지 top3 + 촬영 버튼        */
/* 탑승 시작은 여행 상세에서 누르고, 그때 이 탭으로 넘어온다.              */
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

  const profile = useMyProfile().data;
  const nickname = profile?.nickname ?? "여행자";
  const profileImage = profile?.profile_image ?? null;

  const session = useScenicStore((s) => s.session);
  const result = useScenicStore((s) => s.lastResponse);
  // 탑승 전 안내에 띄울 현재 시각. 배경 시간대도 이 값으로 정해져 1분마다 저절로 넘어간다.
  const now = useMinuteTick();
  const bg = SCENERY_BACKGROUNDS[sceneryTimeSlot(now)];

  // 폴링은 카드 최상단에서 건다 — 접기(collapsed)로 내용이 사라져도 조회가 멈추면 안 된다.
  // 세션이 없으면 훅 내부에서 아무것도 하지 않는다.
  useScenicPolling();

  /**
   * 위치 권한 보유 여부. null 은 아직 확인 전.
   * 권한을 받기 전에는 CTA 가 '기차에 탑승하셨나요?' 안내 버튼이고,
   * 받고 나면 촬영 버튼으로 넘어간다(탑승 중에는 항상 촬영 버튼).
   */
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    hasForegroundLocationPermission().then((ok) => {
      if (alive) setLocationGranted(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onPickPhoto = async (source: MediaSource) => {
    setSheetOpen(false);
    const photo = await pickScenicPhoto(source);
    if (!photo) return; // 취소·권한 거부
    if (travelIdx == null) {
      Alert.alert("여행을 찾지 못했어요", "진행 중인 여행이 있을 때 사진을 붙일 수 있어요.");
      return;
    }
    // 방금 고른 사진을 바로 보여준다(업로드가 끝날 때까지 기다리지 않는다).
    // 실패하면 직전 사진으로 되돌린다.
    const previous = added;
    setAdded(photo);

    // schedule_idx 는 보내지 않는다 — 서버가 사진 EXIF 의 GPS 로 가까운 일정에 매핑한다.
    addImages.mutate(
      { travelIdx, photos: [photo] },
      {
        onError: (err) => {
          setAdded(previous);
          Alert.alert("사진 등록 실패", describeApiError(err));
        },
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
        // 일러스트가 뜨기 전 잠깐 보이는 색.
        backgroundColor: bg.fallback,
      }}
    >
      {/* 시간대별 배경 일러스트 + 글씨가 묻히지 않게 덮는 반투명 막 */}
      <Image
        source={bg.image}
        // className 대신 명시적 스타일 — 배경이 안 깔려도 티가 안 나는 자리라 확실한 쪽으로.
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bg.scrim }]} />

      <View style={{ padding: scale(16) }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center" style={{ gap: scale(6) }}>
            <BellFilledIcon
              width={moderateScale(18)}
              height={moderateScale(20)}
            />
            <Text
              className="font-bold"
              style={{ fontSize: moderateScale(15), color: bg.head }}
            >
              풍경알림
            </Text>
          </View>
          <Pressable onPress={onToggle} hitSlop={8}>
            <Text style={{ fontSize: moderateScale(13), color: bg.head }}>
              {collapsed ? "펼치기" : "접기"}
            </Text>
          </Pressable>
        </View>

        {!collapsed ? (
          <>
            {/* 인사 + 상태 문구 — 탑승 전/중에 따라 두 번째 줄만 달라진다. */}
            <View
              className="flex-row"
              style={{ marginTop: verticalScale(14) }}
            >
              <View
                className="bg-white rounded-full overflow-hidden"
                style={{ width: scale(48), height: scale(48) }}
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : null}
              </View>
              <View style={{ flex: 1, marginLeft: scale(12) }}>
                <Text style={{ fontSize: moderateScale(16), color: bg.text }}>
                  {nickname} 님,
                </Text>
                <Text
                  style={{
                    fontSize: moderateScale(16),
                    marginTop: verticalScale(2),
                    lineHeight: moderateScale(23),
                    color: bg.text,
                  }}
                >
                  {session ? (
                    <>
                      지금{" "}
                      <Text className="font-bold">
                        {normalizeStationName(session.toStation)}
                      </Text>
                      을 지나가고 있어요
                    </>
                  ) : (
                    <>
                      기차 창밖으로 보이는{" "}
                      <Text className="font-bold">풍경</Text>을 실시간으로
                      알려드려요
                    </>
                  )}
                </Text>
                <Text
                  style={{
                    fontSize: moderateScale(12),
                    marginTop: verticalScale(4),
                    color: bg.subText,
                  }}
                >
                  {/* 탑승 중이면 서버 조회 시각, 아니면 지금 시각(1분마다 갱신) */}
                  {session
                    ? result?.based_at
                      ? `${formatBasedAt(result.based_at)} 기준`
                      : "위치를 확인하는 중이에요"
                    : `${formatClockLabel(now)} 기준`}
                </Text>
              </View>
            </View>

            {session ? (
              <RidingDetail session={session} theme={bg} />
            ) : (
              <View style={{ height: verticalScale(12) }} />
            )}

            {!session && locationGranted !== true ? (
              <LocationPrimerButton onResult={setLocationGranted} />
            ) : added ? (
              /* 방금 붙인 사진 — 썸네일 + 안내. 누르면 한 장 더 붙일 수 있다. */
              <Pressable
                onPress={() => setSheetOpen(true)}
                disabled={addImages.isPending}
                className="flex-row items-center rounded-2xl bg-white active:opacity-80"
                style={{
                  height: verticalScale(56),
                  paddingHorizontal: scale(12),
                  gap: scale(12),
                }}
                accessibilityRole="button"
                accessibilityLabel="사진 한 장 더 붙이기"
              >
                {/* 썸네일은 항상 방금 고른 사진. 올리는 중에는 살짝 흐리게 + 스피너. */}
                <View>
                  <Image
                    source={{ uri: added.uri }}
                    style={{
                      width: scale(38),
                      height: scale(38),
                      borderRadius: scale(8),
                      opacity: addImages.isPending ? 0.45 : 1,
                    }}
                    contentFit="cover"
                  />
                  {addImages.isPending ? (
                    <View className="absolute inset-0 items-center justify-center">
                      <ActivityIndicator size="small" color={ACCENT} />
                    </View>
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    className="font-bold"
                    style={{ fontSize: moderateScale(14), color: "#353535" }}
                  >
                    {addImages.isPending ? "사진을 올리는 중" : "사진을 붙였어요"}
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
                {addImages.isPending ? null : (
                  <Text
                    className="font-semibold"
                    style={{ fontSize: moderateScale(13), color: ACCENT }}
                  >
                    한 장 더
                  </Text>
                )}
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
/* 탑승 중 상세 — 구간 · 관광지 top3 · 새로고침 / 탑승 종료               */
/* 여행 상세의 실시간 섹션과 같은 값을 보여준다(스토어를 공유하므로 항상    */
/* 같은 내용이다). 폴링은 부모가 이미 걸어두었다.                          */
/* ------------------------------------------------------------------ */
function RidingDetail({
  session,
  theme,
}: {
  session: ScenicSession;
  /** 배경 시간대에 맞춘 글자색 — 밤 배경에서는 밝은 글씨로 뒤집힌다. */
  theme: SceneryBackground;
}) {
  const result = useScenicStore((s) => s.lastResponse);
  const hasNewSpots = useScenicStore((s) => s.hasNewSpots);
  const stopRiding = useScenicStore((s) => s.stopRiding);
  const loading = useScenicStore((s) => s.loading);
  const error = useScenicStore((s) => s.error);
  // 새로고침만 쓴다 — 구독(폴링 유지)은 부모의 useScenicPolling 이 이미 하고 있다.
  const { refresh } = useScenicPolling();

  // 직접 종료한 구간은 도착 시각 전이라도 자동으로 다시 켜지 않는다.
  const confirmStop = () =>
    Alert.alert("탑승을 종료할까요?", "실시간 풍경 알림이 멈춰요.", [
      { text: "취소", style: "cancel" },
      {
        text: "종료",
        style: "destructive",
        onPress: () => stopRiding({ skipAuto: true }),
      },
    ]);

  return (
    <View style={{ marginTop: verticalScale(14) }}>
      {/* 현재 구간 + 조작 버튼 */}
      <View className="flex-row items-center" style={{ gap: scale(8) }}>
        <Text
          className="flex-1 font-bold"
          style={{ fontSize: moderateScale(14), color: theme.text }}
          numberOfLines={1}
        >
          {session.fromStation} → {session.toStation}
        </Text>

        <Pressable
          onPress={refresh}
          disabled={loading}
          hitSlop={10}
          className="active:opacity-60"
          style={{ padding: scale(6) }}
          accessibilityRole="button"
          accessibilityLabel="새로고침"
        >
          {loading ? (
            <ActivityIndicator size="small" color={ACCENT} />
          ) : (
            <Feather name="refresh-cw" size={moderateScale(16)} color={ACCENT} />
          )}
        </Pressable>

        <Pressable
          onPress={confirmStop}
          className="active:opacity-70 rounded-full bg-white"
          style={{
            paddingHorizontal: scale(12),
            paddingVertical: verticalScale(7),
          }}
          accessibilityRole="button"
          accessibilityLabel="탑승 종료"
        >
          <Text
            className="font-semibold text-gray-600"
            style={{ fontSize: moderateScale(12) }}
          >
            탑승 종료
          </Text>
        </Pressable>
      </View>

      {error ? (
        <Text
          style={{
            fontSize: moderateScale(12),
            color: "#D92D20",
            marginTop: verticalScale(10),
          }}
        >
          {error}
        </Text>
      ) : null}

      {/* 관광지 top3 */}
      {result && result.items.length > 0 ? (
        <View style={{ marginTop: verticalScale(12), gap: verticalScale(8) }}>
          {result.items.map((item, index) => (
            <SpotCard
              key={`${item.name}-${item.distance_m}`}
              item={item}
              // 서버가 거리순으로 준다 → 첫 장이 가장 가까운 곳(내비게이션의 '다음 안내').
              primary={index === 0}
              // 같은 곳만 반복될 땐 강조하지 않는다(매 폴링마다 NEW 가 뜨지 않게).
              highlight={hasNewSpots}
              // 그림 배경 위라 흰 카드 + 회색 뱃지로 뒤집는다.
              backgroundColor="#FFFFFF"
              badgeColor="#F4F4F6"
            />
          ))}
        </View>
      ) : (
        <Text
          style={{
            fontSize: moderateScale(13),
            marginTop: verticalScale(12),
            marginBottom: verticalScale(2),
            color: theme.subText,
          }}
        >
          {result ? "지금은 보이는 관광지가 없어요" : "주변을 살펴보는 중이에요…"}
        </Text>
      )}

      <View style={{ height: verticalScale(12) }} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 탑승 전 CTA — 위치 권한 받아두기                                      */
/*                                                                     */
/* 시스템 권한창을 바로 띄우지 않고 왜 필요한지 먼저 설명한다. 한 번 거부  */
/* 되면 안드로이드가 다시 묻지 않아 설정으로 보내야 하므로, 맥락을 모르는  */
/* 상태에서 권한창을 맞닥뜨리게 하지 않는 편이 허용률에 유리하다.          */
/* ------------------------------------------------------------------ */
function LocationPrimerButton({
  onResult,
}: {
  /** 권한 요청 결과 — 부모가 CTA 를 촬영 버튼으로 넘기는 데 쓴다. */
  onResult: (granted: boolean) => void;
}) {
  const [asking, setAsking] = useState(false);

  const request = async () => {
    setAsking(true);
    const ok = await ensureForegroundLocationPermission();
    setAsking(false);
    onResult(ok);
    if (!ok) {
      Alert.alert(
        "위치 권한이 필요해요",
        "창밖 풍경을 알려드리려면 위치 권한을 허용해 주세요. 설정 > 앱 > 권한에서 바꿀 수 있어요.",
      );
    }
  };

  const onPress = () => {
    Alert.alert(
      "기차에 탑승하셨나요?",
      "현재 위치를 기반으로 실시간 풍경 스팟을 알려드리고, 최적의 여행 경험을 제공하기 위해 위치 정보에 접근합니다.",
      [
        { text: "나중에", style: "cancel" },
        { text: "확인", onPress: () => void request() },
      ],
    );
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={asking}
      className="items-center justify-center rounded-2xl active:opacity-80"
      style={{
        height: verticalScale(56),
        backgroundColor: ACCENT,
        opacity: asking ? 0.6 : 1,
      }}
      accessibilityRole="button"
      accessibilityLabel="기차에 탑승하셨나요?"
    >
      {asking ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text
          className="text-white font-bold"
          style={{ fontSize: moderateScale(16) }}
        >
          기차에 탑승하셨나요?
        </Text>
      )}
    </Pressable>
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
