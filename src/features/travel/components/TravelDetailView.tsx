import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { isAxiosError } from "axios";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import {
  formatClockTime,
  formatDayDate,
  formatTravelPeriod,
  travelStatusLabel,
} from "../format";
import { useTravelDetail } from "../queries";
import type {
  TravelDay,
  TravelDetail,
  TravelScheduleItem,
  TravelStatus,
} from "../types";

/* 추천 결과 타임라인과 동일한 다크 팔레트 재사용 */
const DARK_BG = "#1A1A1A";
const DARK_TEXT = "#FFFFFF";
const DARK_SUB = "#A1A1AA";
const DARK_DIM = "#6E6E73";
const DARK_LINE = "#3A3A3C";
const ACCENT = "#5E84F4";
const PLACE = "#B0E6DB";

const RAIL_W = scale(30);
const RAIL_GAP = scale(12);

/**
 * 여행 1건의 일정표 상세(일자별 타임라인).
 * 일정 탭 '예정된 여행'(인라인)과 다녀온 여행 상세 화면(푸시)이 공통으로 사용한다.
 * 로딩/에러(404·401)/빈 일정까지 자체 처리한다.
 */
export default function TravelDetailView({
  travelIdx,
}: {
  travelIdx: number;
}) {
  const { data, isLoading, error, refetch } = useTravelDetail(travelIdx);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  if (error || !data) {
    const notFound = isAxiosError(error) && error.response?.status === 404;
    return (
      <View
        className="flex-1 items-center justify-center bg-white"
        style={{ paddingHorizontal: scale(24), gap: verticalScale(12) }}
      >
        <Text
          className="font-semibold text-gray-900"
          style={{ fontSize: moderateScale(16) }}
        >
          {notFound ? "여행을 찾을 수 없어요" : "일정을 불러오지 못했어요"}
        </Text>
        <Pressable
          onPress={() => refetch()}
          className="bg-gray-800 rounded-full active:opacity-80"
          style={{
            paddingHorizontal: scale(20),
            paddingVertical: verticalScale(10),
          }}
        >
          <Text
            className="text-white font-semibold"
            style={{ fontSize: moderateScale(14) }}
          >
            다시 시도
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: verticalScale(24) }}
    >
      <DetailHeader travel={data} />

      {/* 일자별 타임라인 (다크 시트) */}
      <View
        style={{
          marginTop: verticalScale(16),
          backgroundColor: DARK_BG,
          borderTopLeftRadius: scale(24),
          borderTopRightRadius: scale(24),
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(24),
          paddingBottom: verticalScale(32),
        }}
      >
        {data.days.length === 0 ? (
          <Text
            className="text-center"
            style={{
              color: DARK_SUB,
              fontSize: moderateScale(14),
              paddingVertical: verticalScale(40),
            }}
          >
            등록된 일정이 없어요
          </Text>
        ) : (
          data.days.map((day, i) => (
            <DaySection key={day.day_no} day={day} first={i === 0} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/* 헤더 — 제목 / 기간 / 지역 / 상태 배지                                 */
/* ------------------------------------------------------------------ */
function DetailHeader({ travel }: { travel: TravelDetail }) {
  return (
    <View
      style={{
        paddingHorizontal: scale(20),
        paddingTop: verticalScale(16),
      }}
    >
      <StatusBadge status={travel.status} />
      <Text
        className="font-bold text-gray-900"
        style={{ fontSize: moderateScale(22), marginTop: verticalScale(10) }}
        numberOfLines={2}
      >
        {travel.title}
      </Text>
      <Text
        className="text-gray-500"
        style={{ fontSize: moderateScale(14), marginTop: verticalScale(6) }}
      >
        {formatTravelPeriod(travel.start_date, travel.end_date)}
        {travel.region ? ` · ${travel.region}` : ""}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status: TravelStatus }) {
  const bg: Record<TravelStatus, string> = {
    PLANNED: "#5E84F4",
    ONGOING: "#22C55E",
    COMPLETED: "#6B7280",
  };
  return (
    <View
      className="self-start rounded-full"
      style={{
        backgroundColor: bg[status],
        paddingHorizontal: scale(10),
        paddingVertical: verticalScale(3),
      }}
    >
      <Text
        className="text-white font-semibold"
        style={{ fontSize: moderateScale(11) }}
      >
        {travelStatusLabel(status)}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* DAY 섹션 — 헤더 + 항목 레일                                          */
/* ------------------------------------------------------------------ */
function DaySection({ day, first }: { day: TravelDay; first: boolean }) {
  return (
    <View style={{ marginTop: first ? 0 : verticalScale(28) }}>
      <View
        className="flex-row items-center"
        style={{ gap: scale(8), marginBottom: verticalScale(18) }}
      >
        <Text
          className="font-bold"
          style={{ color: DARK_TEXT, fontSize: moderateScale(18) }}
        >
          DAY {day.day_no}
        </Text>
        <Text style={{ color: DARK_SUB, fontSize: moderateScale(14) }}>
          {formatDayDate(day.date)}
        </Text>
      </View>

      {day.items.map((item, i) => (
        <TimelineRow
          key={item.schedule_idx}
          item={item}
          isLast={i === day.items.length - 1}
        />
      ))}
    </View>
  );
}

function TimelineRow({
  item,
  isLast,
}: {
  item: TravelScheduleItem;
  isLast: boolean;
}) {
  const isTrain = item.kind === "train";
  const tint = isTrain ? ACCENT : PLACE;
  return (
    <View style={{ flexDirection: "row" }}>
      {/* 레일 (마커 + 연결선) */}
      <View style={{ width: RAIL_W, alignItems: "center", marginRight: RAIL_GAP }}>
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: scale(30),
            height: scale(30),
            borderWidth: 1.5,
            borderColor: tint,
            backgroundColor: DARK_BG,
          }}
        >
          <MaterialCommunityIcons
            name={isTrain ? "train" : "map-marker"}
            size={moderateScale(16)}
            color={tint}
          />
        </View>
        {!isLast ? <DottedLine /> : null}
      </View>

      {/* 본문 */}
      <View style={{ flex: 1, paddingBottom: verticalScale(22) }}>
        {isTrain ? <TrainBody item={item} /> : <PlaceItemBody item={item} />}
      </View>
    </View>
  );
}

/** 세로 점선 — 노드 사이를 점 5개로 균등하게. */
function DottedLine() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: verticalScale(4),
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: DARK_LINE,
          }}
        />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 항목 본문                                                            */
/* ------------------------------------------------------------------ */
function TrainBody({ item }: { item: TravelScheduleItem }) {
  const timeRange = formatTimeRange(item.start_time, item.end_time);
  const seat = [item.car_no, item.seat_no].filter(Boolean).join(" ");
  return (
    <View>
      <Text
        className="font-bold"
        style={{ fontSize: moderateScale(16), color: DARK_TEXT }}
        numberOfLines={2}
      >
        {item.title}
      </Text>

      <View
        className="flex-row items-center"
        style={{ gap: scale(6), marginTop: verticalScale(8) }}
      >
        {item.train_grade ? (
          <View
            className="rounded-md"
            style={{
              backgroundColor: ACCENT,
              paddingHorizontal: scale(9),
              paddingVertical: verticalScale(2),
            }}
          >
            <Text
              className="font-bold"
              style={{ fontSize: moderateScale(11), color: DARK_BG }}
            >
              {item.train_grade}
            </Text>
          </View>
        ) : null}
        {item.dep_station && item.arr_station ? (
          <Text
            className="font-semibold"
            style={{ fontSize: moderateScale(13), color: ACCENT }}
          >
            {item.dep_station} → {item.arr_station}
          </Text>
        ) : null}
      </View>

      {timeRange ? (
        <Text
          style={{
            color: DARK_SUB,
            fontSize: moderateScale(12),
            marginTop: verticalScale(8),
          }}
        >
          {timeRange}
        </Text>
      ) : null}

      {seat ? (
        <Text
          style={{
            color: DARK_DIM,
            fontSize: moderateScale(12),
            marginTop: verticalScale(4),
          }}
        >
          {seat}
        </Text>
      ) : null}

      {item.memo ? <Memo text={item.memo} /> : null}
    </View>
  );
}

function PlaceItemBody({ item }: { item: TravelScheduleItem }) {
  const timeRange = formatTimeRange(item.start_time, item.end_time);
  return (
    <View>
      <Text
        className="font-bold"
        style={{ fontSize: moderateScale(16), color: DARK_TEXT }}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      {timeRange ? (
        <Text
          style={{
            color: DARK_SUB,
            fontSize: moderateScale(12),
            marginTop: verticalScale(4),
          }}
        >
          {timeRange}
        </Text>
      ) : null}

      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          contentFit="cover"
          style={{
            width: "100%",
            height: verticalScale(150),
            borderRadius: scale(14),
            marginTop: verticalScale(10),
          }}
        />
      ) : null}

      {item.memo ? <Memo text={item.memo} /> : null}
    </View>
  );
}

function Memo({ text }: { text: string }) {
  return (
    <Text
      style={{
        color: DARK_DIM,
        fontSize: moderateScale(12),
        marginTop: verticalScale(8),
        lineHeight: moderateScale(17),
      }}
    >
      {text}
    </Text>
  );
}

/** "09:33 - 11:10" / 한쪽만 있으면 그쪽만. "HH:MM:SS" 입력. */
function formatTimeRange(
  start: string | null,
  end: string | null,
): string {
  const s = formatClockTime(start);
  const e = formatClockTime(end);
  if (s && e) return `${s} - ${e}`;
  return s || e || "";
}
