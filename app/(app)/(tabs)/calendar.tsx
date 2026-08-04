import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import RenameTravelModal from "@/src/features/travel/components/RenameTravelModal";
import TravelMenuSheet from "@/src/features/travel/components/TravelMenuSheet";
import TravelSummaryCard from "@/src/features/travel/components/TravelSummaryCard";
import { describeScheduleError } from "@/src/features/travel/errors";
import {
  useCurrentTravel,
  useDeleteTravel,
  usePastTravels,
  usePrefetchTravelDetail,
} from "@/src/features/travel/queries";
import type { HomeTravelCard } from "@/src/features/travel/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";

// 헤더 우측 아이콘 (Figma base64 → 검증된 PNG, 100x100)
const HEADER_ICON = require("../../../assets/images/style/schedule-table.png");
// 프로모 배너 기차 일러스트 (220x220)
const PASS_TRAIN = require("../../../assets/images/style/passTrain.png");

type Tab = "upcoming" | "past";

/** 여행 카드 → 일정표 상세로 이동. */
function goDetail(travel: { travel_idx: number; cover_image_url: string | null }) {
  router.push({
    pathname: "/travel/[travelIdx]",
    params: {
      travelIdx: travel.travel_idx,
      cover: travel.cover_image_url ?? "",
    },
  });
}

/**
 * 세 번째 탭 '내 일정' — 예정된 여행 / 다녀온 여행. 둘 다 요약 카드로 표시하고
 * 누르면 일정표 상세로 이동한다. 승차권 예매·일정추천 진입은 홈 퀵메뉴로 유지.
 */
export default function CalendarTab() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const { data: current, isLoading: currentLoading } = useCurrentTravel();

  // 예정된 여행 상세 일정을 미리 받아둔다 → 상세 화면 진입 시 로딩 없이 즉시 표시.
  usePrefetchTravelDetail(current?.travel_idx);

  // ⋮ 메뉴 / 이름 바꾸기 모달 상태.
  // 스냅샷을 로컬에 잡아두는 이유: 삭제 mutation 진행 중 서버 응답 오면 current 가 null 로
  // 바뀌면서 시트가 사라져 로딩/에러 알림 위치가 튀지 않게 하기 위함.
  const [menuTravel, setMenuTravel] = useState<HomeTravelCard | null>(null);
  const [renameTravel, setRenameTravel] = useState<HomeTravelCard | null>(null);
  const del = useDeleteTravel();

  const confirmDelete = (travel: HomeTravelCard) => {
    Alert.alert(
      "여행을 삭제할까요?",
      `'${travel.title}'과 이 여행의 일정이 모두 삭제돼요.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () =>
            del.mutate(travel.travel_idx, {
              onError: (e) =>
                Alert.alert("삭제 실패", describeScheduleError(e)),
            }),
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* 헤더 */}
      <View
        className="flex-row items-center justify-between bg-white"
        style={{
          paddingHorizontal: scale(20),
          height: verticalScale(44),
        }}
      >
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(20) }}
        >
          내 일정
        </Text>
        <Pressable
          // TODO(ticket): 승차권함 진입(현재 무동작).
          hitSlop={12}
          className="active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="승차권"
        >
          <Image
            source={HEADER_ICON}
            contentFit="contain"
            style={{ width: moderateScale(32), height: moderateScale(24) }}
          />
        </Pressable>
      </View>

      <PromoBanner />

      {/* 알약 서브탭 */}
      <View
        className="flex-row"
        style={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(28),
          paddingBottom: verticalScale(22),
          gap: scale(10),
        }}
      >
        {(
          [
            { key: "upcoming", label: "예정된 여행" },
            { key: "past", label: "다녀온 여행" },
          ] as const
        ).map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              className="items-center justify-center active:opacity-80"
              style={{
                width: scale(100),
                height: verticalScale(41),
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? ACCENT : "#D1D5DB",
                backgroundColor: active ? "#EEF2FF" : "#FFFFFF",
              }}
            >
              <Text
                className={active ? "font-semibold" : "font-medium"}
                style={{
                  fontSize: moderateScale(14),
                  color: active ? ACCENT : "#6B7280",
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "upcoming" ? (
        <UpcomingTab
          current={current}
          loading={currentLoading}
          onMenuPress={setMenuTravel}
        />
      ) : (
        <PastTab />
      )}

      <TravelMenuSheet
        visible={!!menuTravel}
        travelTitle={menuTravel?.title ?? ""}
        onClose={() => setMenuTravel(null)}
        // '내 여행 영상 만들기' 는 아직 미구현 → onMakeVideo 미전달로 비활성 표시.
        onRename={() => {
          const t = menuTravel;
          setMenuTravel(null);
          if (t) setRenameTravel(t);
        }}
        onDelete={() => {
          const t = menuTravel;
          setMenuTravel(null);
          if (t) confirmDelete(t);
        }}
      />

      {renameTravel ? (
        <RenameTravelModal
          visible
          travelIdx={renameTravel.travel_idx}
          currentTitle={renameTravel.title}
          onClose={() => setRenameTravel(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* 프로모 배너                                                          */
/* ------------------------------------------------------------------ */
function PromoBanner() {
  return (
    <View style={{ paddingHorizontal: scale(20), paddingTop: verticalScale(18) }}>
      <View
        className="flex-row items-center"
        style={{
          backgroundColor: "#DCE6FB",
          borderRadius: scale(16),
          paddingHorizontal: scale(18),
          paddingVertical: verticalScale(18),
          gap: scale(12),
        }}
      >
        <View style={{ flex: 1 }}>
          {/* '내일로 패스 정보'만 굵게, 나머지는 얇게(기본 굵기) */}
          <Text
            style={{ fontSize: moderateScale(14), lineHeight: moderateScale(21) }}
          >
            <Text className="font-bold text-gray-900">내일로 패스 정보</Text>
            <Text className="text-gray-700">를 등록하고,</Text>
          </Text>
          <Text
            className="text-gray-700"
            style={{ fontSize: moderateScale(14), lineHeight: moderateScale(21) }}
          >
            나에게 맞는 여행 계획을 시작해 보세요.
          </Text>
        </View>
        <Image
          source={PASS_TRAIN}
          contentFit="contain"
          style={{ width: moderateScale(50), height: moderateScale(50) }}
        />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 예정된 여행 — D-day 카드                                             */
/* ------------------------------------------------------------------ */
function UpcomingTab({
  current,
  loading,
  onMenuPress,
}: {
  current: HomeTravelCard | null | undefined;
  loading: boolean;
  onMenuPress: (travel: HomeTravelCard) => void;
}) {
  if (loading) return <Loading />;

  if (!current) {
    return (
      <View style={{ paddingHorizontal: scale(20), paddingTop: verticalScale(6) }}>
        <View
          className="items-center justify-center"
          style={{
            backgroundColor: "#F5F5F7",
            borderRadius: scale(16),
            height: verticalScale(170),
            paddingHorizontal: scale(20),
          }}
        >
          <Text
            className="font-bold text-gray-900"
            style={{ fontSize: moderateScale(16) }}
          >
            아직 등록된 일정이 없어요
          </Text>
          <Text
            className="text-gray-500"
            style={{ fontSize: moderateScale(13), marginTop: verticalScale(6) }}
          >
            지금 바로 나만의 여행 일정을 만들어보세요
          </Text>
          <Pressable
            onPress={() => router.navigate("/course/intro")}
            className="flex-row items-center justify-center bg-white active:opacity-80"
            style={{
              marginTop: verticalScale(18),
              alignSelf: "stretch",
              height: verticalScale(52),
              borderRadius: scale(12),
              gap: scale(6),
            }}
          >
            <Feather name="plus" size={moderateScale(18)} color="#668DFF" />
            <Text
              className="font-bold"
              style={{ fontSize: moderateScale(15), color: "#668DFF" }}
            >
              새 여행 일정 만들기
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: scale(20), paddingTop: verticalScale(6) }}>
      <TravelSummaryCard
        badge={dDayLabel(current)}
        badgeColor={ACCENT}
        title={current.title}
        startDate={current.start_date}
        endDate={current.end_date}
        onPress={() => goDetail(current)}
        onMenuPress={() => onMenuPress(current)}
      />
    </View>
  );
}

/** 출발일까지 남은 일수 배지. 여행중이면 "여행중". */
function dDayLabel(travel: HomeTravelCard): string {
  if (travel.status === "ONGOING") return "여행중";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${travel.start_date}T00:00:00`);
  if (Number.isNaN(start.getTime())) return "예정";
  const diff = Math.round((start.getTime() - today.getTime()) / 86400000);
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-DAY";
  return "여행중";
}

/* ------------------------------------------------------------------ */
/* 다녀온 여행 — 완료 카드 목록(민트)                                    */
/* ------------------------------------------------------------------ */
function PastTab() {
  const { data, isLoading } = usePastTravels();
  const travels = data?.travels ?? [];

  if (isLoading) return <Loading />;

  if (travels.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400" style={{ fontSize: moderateScale(15) }}>
          아직 다녀온 여행이 없어요
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: scale(20),
        paddingTop: verticalScale(6),
        paddingBottom: verticalScale(24),
        gap: verticalScale(12),
      }}
    >
      {travels.map((t) => (
        <TravelSummaryCard
          key={t.travel_idx}
          badge="완료"
          badgeColor="#B0E6DB"
          badgeTextColor="#111827"
          showCheck
          fixedBadge
          title={t.title}
          startDate={t.start_date}
          endDate={t.end_date}
          onPress={() => goDetail(t)}
        />
      ))}
    </ScrollView>
  );
}

function Loading() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator color={ACCENT} />
    </View>
  );
}
