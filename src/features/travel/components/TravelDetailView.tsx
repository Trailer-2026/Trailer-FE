import Feather from "@expo/vector-icons/Feather";
import { isAxiosError } from "axios";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import TicketIcon from "@/src/components/icons/TicketIcon";
import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { describeScheduleError } from "../errors";
import { formatClockTime, formatDayDate, formatLongDate } from "../format";
import { useDeleteSchedule, useTravelDetail } from "../queries";
import type { TravelDay, TravelDetail, TravelScheduleItem } from "../types";
import AddScheduleModal, {
  type ScheduleKind,
} from "./schedule/AddScheduleModal";
import EditScheduleModal from "./schedule/EditScheduleModal";

const ACCENT = "#5E84F4";
const MINT = "#34C6A8"; // 타임라인 번호 노드
const CARD_BG = "#F4F4F6";
const RAIL_LINE = "#D9DCE1";
const HOLLOW_RING = "#D1D5DB";

const KTX_LOGO = require("../../../../assets/images/style/ktx.png");
const PLACEHOLDER = require("../../../../assets/images/Main.png");

const RAIL_W = scale(30);
const RAIL_GAP = scale(12);

/**
 * 여행 1건의 일정표 상세(히어로 + 일자별 타임라인).
 * 일정 탭 '예정된 여행'(인라인)과 다녀온 여행 상세 화면(푸시)이 공통으로 사용한다.
 *
 * - coverImageUrl: 히어로 배경(TravelDetail 응답엔 커버가 없어 호출부가 넘긴다).
 *   없으면 일정 항목 이미지 → placeholder 순으로 대체.
 * - onBack: 주면 히어로 위에 뒤로 버튼을 얹는다(푸시 화면용). 인라인 탭에선 생략.
 */
export default function TravelDetailView({
  travelIdx,
  coverImageUrl,
  onBack,
}: {
  travelIdx: number;
  coverImageUrl?: string | null;
  onBack?: () => void;
}) {
  const { data, isLoading, error, refetch } = useTravelDetail(travelIdx);
  const insets = useSafeAreaInsets();

  // 추가 모달 상태 — kind 로 장소/티켓 폼이 바로 열린다(중간 선택 시트 없음).
  // dayNo 는 장소 폼의 날짜 프리필용.
  const [addState, setAddState] = useState<{
    kind: ScheduleKind;
    dayNo?: number;
  } | null>(null);
  const [editTarget, setEditTarget] = useState<{
    item: TravelScheduleItem;
    dayNo: number;
  } | null>(null);
  const del = useDeleteSchedule(travelIdx);

  // 항목 길게 누르면 편집/삭제 선택.
  const openItemMenu = (item: TravelScheduleItem, dayNo: number) => {
    Alert.alert(item.title || "일정", undefined, [
      { text: "편집", onPress: () => setEditTarget({ item, dayNo }) },
      {
        text: "삭제",
        style: "destructive",
        onPress: () =>
          Alert.alert("일정을 삭제할까요?", "삭제하면 되돌릴 수 없어요.", [
            { text: "취소", style: "cancel" },
            {
              text: "삭제",
              style: "destructive",
              onPress: () =>
                del.mutate(item.schedule_idx, {
                  onError: (e) =>
                    Alert.alert("삭제 실패", describeScheduleError(e)),
                }),
            },
          ]),
      },
      { text: "취소", style: "cancel" },
    ]);
  };

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

  const cover = coverImageUrl ?? firstItemImage(data);

  return (
    <>
      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: verticalScale(32) + insets.bottom }}
      >
        <Hero
          travel={data}
          coverUri={cover}
          onBack={onBack}
          onAddTicket={() => setAddState({ kind: "train" })}
        />

        <View style={{ paddingHorizontal: scale(20), marginTop: verticalScale(4) }}>
          {data.days.length === 0 ? (
            <EmptyDays onAdd={() => setAddState({ kind: "visit" })} />
          ) : (
            data.days.map((day) => (
              <DaySection
                key={day.day_no}
                day={day}
                onAdd={() => setAddState({ kind: "visit", dayNo: day.day_no })}
                onItemMenu={(item) => openItemMenu(item, day.day_no)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {addState ? (
        <AddScheduleModal
          visible
          onClose={() => setAddState(null)}
          travelIdx={travelIdx}
          kind={addState.kind}
          initialDayNo={addState.dayNo}
        />
      ) : null}
      {editTarget ? (
        <EditScheduleModal
          visible
          onClose={() => setEditTarget(null)}
          travelIdx={travelIdx}
          item={editTarget.item}
          dayNo={editTarget.dayNo}
        />
      ) : null}
    </>
  );
}

/** 일정이 하나도 없을 때 — 안내 + 추가 버튼. */
function EmptyDays({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={{ paddingVertical: verticalScale(32), alignItems: "center" }}>
      <Text
        className="text-gray-400"
        style={{ fontSize: moderateScale(14), marginBottom: verticalScale(16) }}
      >
        등록된 일정이 없어요
      </Text>
      <AddButton onPress={onAdd} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 히어로 — 커버 이미지 안에 제목/기간 + 티켓 추가 카드 (+ 뒤로)          */
/* ------------------------------------------------------------------ */
function Hero({
  travel,
  coverUri,
  onBack,
  onAddTicket,
}: {
  travel: TravelDetail;
  coverUri: string | null;
  onBack?: () => void;
  onAddTicket: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const source = coverUri && !failed ? { uri: coverUri } : PLACEHOLDER;

  return (
    <View style={{ height: verticalScale(190) }}>
      <ImageBackground
        source={source}
        resizeMode="cover"
        style={{ flex: 1 }}
        onError={() => setFailed(true)}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.35)", "transparent", "rgba(0,0,0,0.35)"]}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={{
              position: "absolute",
              left: scale(20),
              top: verticalScale(12),
              width: scale(28),
              height: scale(28),
              justifyContent: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel="뒤로"
          >
            <BackIcon
              color="#FFFFFF"
              width={moderateScale(12)}
              height={moderateScale(17)}
            />
          </Pressable>
        ) : null}

        {/* 제목·기간·티켓 카드 모두 커버 이미지 안쪽 하단에 얹는다. */}
        <View
          style={{
            position: "absolute",
            left: scale(20),
            right: scale(20),
            bottom: verticalScale(14),
          }}
        >
          <Text
            className="text-white font-bold"
            style={{ fontSize: moderateScale(20) }}
            numberOfLines={2}
          >
            {travel.title}
          </Text>
          <Text
            className="text-white"
            style={{
              fontSize: moderateScale(13),
              marginTop: verticalScale(4),
              opacity: 0.95,
            }}
          >
            {formatLongDate(travel.start_date)} ~ {formatLongDate(travel.end_date)}
          </Text>
          <TicketAddCard onPress={onAddTicket} />
        </View>
      </ImageBackground>
    </View>
  );
}

/** 커버 이미지 안, 제목/기간 바로 아래 놓이는 티켓 추가 카드. */
function TicketAddCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-white active:opacity-80"
      style={{
        marginTop: verticalScale(18),
        width: scale(320),
        height: verticalScale(48),
        // 거의 사각형 — 모서리만 살짝. 그림자 대신 바깥 회색 테두리로 경계를 준다.
        borderRadius: scale(6),
        borderWidth: 1,
        borderColor: "#D9DCE1",
        paddingHorizontal: scale(16),
        gap: scale(10),
      }}
      accessibilityRole="button"
      accessibilityLabel="KTX 티켓 정보 추가하기"
    >
      <TicketIcon width={moderateScale(26)} height={moderateScale(26)} />
      <Text
        className="flex-1 font-bold text-gray-800"
        style={{ fontSize: moderateScale(14) }}
      >
        KTX 티켓 정보 추가하기
      </Text>
      <Feather name="plus" size={moderateScale(20)} color={ACCENT} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* DAY 섹션 — Day 배지 + 날짜 + 번호 타임라인 + 일정 추가                */
/* ------------------------------------------------------------------ */
type Row =
  | { t: "board" | "alight"; item: TravelScheduleItem }
  | { t: "place"; item: TravelScheduleItem };

/**
 * 표시 순서 정렬 — 시작 시각("HH:MM:SS", 없으면 맨 뒤) 오름차순.
 * 서버는 추가 항목을 그날 마지막 sequence 로 붙이지만, 화면은 시간순으로 보여준다.
 * 같은 시각은 원래 순서 유지(안정 정렬).
 */
function sortByStartTime(items: TravelScheduleItem[]): TravelScheduleItem[] {
  return [...items].sort((a, b) => {
    const at = a.start_time ?? "";
    const bt = b.start_time ?? "";
    if (!at && !bt) return 0;
    if (!at) return 1;
    if (!bt) return -1;
    return at < bt ? -1 : at > bt ? 1 : 0;
  });
}

/** 일정 항목 → 타임라인 행으로 확장. train 은 승차/하차 2행, 그 외는 1행. */
function toRows(items: TravelScheduleItem[]): Row[] {
  const out: Row[] = [];
  items.forEach((item) => {
    if (item.kind === "train") {
      out.push({ t: "board", item });
      out.push({ t: "alight", item });
    } else {
      out.push({ t: "place", item });
    }
  });
  return out;
}

function DaySection({
  day,
  onAdd,
  onItemMenu,
}: {
  day: TravelDay;
  onAdd: () => void;
  onItemMenu: (item: TravelScheduleItem) => void;
}) {
  // 시간순으로 보여준다(서버 sequence 순 대신). train 은 승차/하차가 한 묶음으로 이동.
  const rows = toRows(sortByStartTime(day.items));
  // 승차/장소 노드에만 순번을 매기고 하차는 빈 노드로 둔다.
  let seq = 0;

  return (
    <View style={{ marginTop: verticalScale(20) }}>
      <View
        className="flex-row items-center"
        style={{ gap: scale(8), marginBottom: verticalScale(14) }}
      >
        <View
          className="rounded-md"
          style={{
            backgroundColor: ACCENT,
            paddingHorizontal: scale(9),
            paddingVertical: verticalScale(3),
          }}
        >
          <Text
            className="text-white font-bold"
            style={{ fontSize: moderateScale(13) }}
          >
            Day {day.day_no}
          </Text>
        </View>
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(16) }}
        >
          {formatDayDate(day.date)}
        </Text>
      </View>

      {rows.map((row, i) => {
        const number = row.t === "alight" ? null : ++seq;
        return (
          <TimelineRow
            key={`${row.item.schedule_idx}-${row.t}`}
            row={row}
            number={number}
            isLast={i === rows.length - 1}
            onLongPress={() => onItemMenu(row.item)}
          />
        );
      })}

      <AddButton onPress={onAdd} />
    </View>
  );
}

/** 일정 추가 버튼(흰색 아웃라인). 길게 눌러 편집/삭제 안내도 겸한다. */
function AddButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center bg-white active:opacity-70"
      style={{
        marginTop: verticalScale(4),
        height: verticalScale(46),
        borderRadius: scale(10),
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
      accessibilityRole="button"
      accessibilityLabel="일정 추가"
    >
      <Text
        className="font-medium text-gray-600"
        style={{ fontSize: moderateScale(14) }}
      >
        일정 추가
      </Text>
    </Pressable>
  );
}

function TimelineRow({
  row,
  number,
  isLast,
  onLongPress,
}: {
  row: Row;
  number: number | null;
  isLast: boolean;
  onLongPress: () => void;
}) {
  return (
    <View style={{ flexDirection: "row" }}>
      {/* 레일 (번호 노드 + 연결선) */}
      <View style={{ width: RAIL_W, alignItems: "center", marginRight: RAIL_GAP }}>
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: scale(28),
            height: scale(28),
            borderWidth: 1.5,
            borderColor: number != null ? MINT : HOLLOW_RING,
            backgroundColor: number != null ? "#FFFFFF" : "#EEF0F3",
          }}
        >
          {number != null ? (
            <Text
              className="font-bold"
              style={{ fontSize: moderateScale(13), color: MINT }}
            >
              {number}
            </Text>
          ) : null}
        </View>
        {!isLast ? (
          <View style={{ flex: 1, width: 2, backgroundColor: RAIL_LINE }} />
        ) : null}
      </View>

      {/* 카드 — 길게 눌러 편집/삭제 */}
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={350}
        className="active:opacity-80"
        style={{ flex: 1, paddingBottom: verticalScale(12) }}
      >
        {row.t === "board" ? (
          <BoardCard item={row.item} />
        ) : row.t === "alight" ? (
          <AlightCard item={row.item} />
        ) : (
          <PlaceCard item={row.item} />
        )}
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 카드 본문                                                            */
/* ------------------------------------------------------------------ */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: CARD_BG,
        borderRadius: scale(12),
        paddingHorizontal: scale(14),
        paddingVertical: verticalScale(14),
      }}
    >
      {children}
    </View>
  );
}

function BoardCard({ item }: { item: TravelScheduleItem }) {
  const dep = item.dep_station ?? "";
  const arr = item.arr_station ?? "";
  const start = formatClockTime(item.start_time);
  const end = formatClockTime(item.end_time);
  const route =
    dep && arr && start && end ? `${dep} ${start} - ${arr} ${end}` : "";

  return (
    <Card>
      {route ? (
        <Text
          className="font-semibold"
          style={{ color: ACCENT, fontSize: moderateScale(12) }}
        >
          {route}
        </Text>
      ) : null}

      <View
        className="flex-row items-center"
        style={{ gap: scale(6), marginTop: verticalScale(route ? 8 : 0) }}
      >
        <Image
          source={KTX_LOGO}
          contentFit="contain"
          style={{ width: moderateScale(44), height: moderateScale(16) }}
        />
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(16) }}
          numberOfLines={1}
        >
          {dep ? `${dep} 승차` : item.title}
        </Text>
      </View>

      {(item.train_grade || arr) ? (
        <View
          className="flex-row items-center"
          style={{ gap: scale(6), marginTop: verticalScale(10) }}
        >
          {item.train_grade ? (
            <View
              className="rounded-md"
              style={{
                backgroundColor: "#CBEFDC",
                paddingHorizontal: scale(9),
                paddingVertical: verticalScale(3),
              }}
            >
              <Text
                className="font-bold"
                style={{ fontSize: moderateScale(11), color: "#111827" }}
              >
                {item.train_grade}
              </Text>
            </View>
          ) : null}
          {arr ? (
            <Text
              className="font-semibold text-gray-500"
              style={{ fontSize: moderateScale(13) }}
            >
              {arr}행
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function AlightCard({ item }: { item: TravelScheduleItem }) {
  const end = formatClockTime(item.end_time);
  const arr = item.arr_station ?? "";
  return (
    <Card>
      {end ? (
        <Text
          className="font-semibold"
          style={{ color: ACCENT, fontSize: moderateScale(13) }}
        >
          {end}
        </Text>
      ) : null}
      <Text
        className="font-bold text-gray-900"
        style={{ fontSize: moderateScale(16), marginTop: verticalScale(end ? 4 : 0) }}
      >
        {arr ? `${arr} 하차` : item.title}
      </Text>
    </Card>
  );
}

function PlaceCard({ item }: { item: TravelScheduleItem }) {
  const start = formatClockTime(item.start_time);
  return (
    <Card>
      {start ? (
        <Text
          className="font-semibold"
          style={{ color: ACCENT, fontSize: moderateScale(13) }}
        >
          {start}
        </Text>
      ) : null}
      <Text
        className="font-bold text-gray-900"
        style={{ fontSize: moderateScale(16), marginTop: verticalScale(start ? 4 : 0) }}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          contentFit="cover"
          style={{
            width: "100%",
            height: verticalScale(140),
            borderRadius: scale(10),
            marginTop: verticalScale(10),
          }}
        />
      ) : null}
      {item.memo ? (
        <Text
          className="text-gray-500"
          style={{
            fontSize: moderateScale(12),
            marginTop: verticalScale(8),
            lineHeight: moderateScale(17),
          }}
        >
          {item.memo}
        </Text>
      ) : null}
    </Card>
  );
}

/** 커버 대체용 — 첫 일정 항목 이미지. */
function firstItemImage(detail: TravelDetail): string | null {
  for (const day of detail.days) {
    for (const item of day.items) {
      if (item.image_url) return item.image_url;
    }
  }
  return null;
}
