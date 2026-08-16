import Feather from "@expo/vector-icons/Feather";
import { isAxiosError } from "axios";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Fragment, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useConfirmDialog } from "@/src/components/ConfirmDialog";
import BackIcon from "@/src/components/icons/BackIcon";
import PlayIcon from "@/src/components/icons/PlayIcon";
import TicketIcon from "@/src/components/icons/TicketIcon";
import { Text } from "@/src/components/Text";
import MediaSourceSheet, {
  type MediaSource,
} from "@/src/features/reels/components/MediaSourceSheet";
import { pickScenicPhoto } from "@/src/features/scenic/capture";
import LiveScenerySection from "@/src/features/scenic/components/LiveScenerySection";
import LocationPermissionPrompt from "@/src/features/scenic/components/LocationPermissionPrompt";
import ScenicTimelineRow from "@/src/features/scenic/components/ScenicTimelineRow";
import { HEADER_HEIGHT, HEADER_TOP_GAP } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { describeScheduleError } from "../errors";
import { formatClockTime, formatDayDate, formatLongDate } from "../format";
import {
  useAddTravelImages,
  useDeleteSchedule,
  useDeleteTravelImage,
  useTravelDetail,
} from "../queries";
import type {
  TravelDay,
  TravelDetail,
  TravelScheduleImage,
  TravelScheduleItem,
} from "../types";
import AddScheduleModal, {
  type ScheduleKind,
} from "./schedule/AddScheduleModal";
import EditScheduleModal from "./schedule/EditScheduleModal";
import ScheduleItemMenuSheet from "./schedule/ScheduleItemMenuSheet";
import TicketWalletModal from "./ticket/TicketWalletModal";

const ACCENT = "#5E84F4";
const MINT = "#34C6A8"; // 타임라인 번호 노드
const CARD_BG = "#F4F4F6";
const RAIL_LINE = "#D9DCE1";
const HOLLOW_RING = "#D1D5DB";

const KTX_LOGO = require("../../../../assets/images/style/ktx.png");
const PLACEHOLDER = require("../../../../assets/images/Main1.png");

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
  // 확인/결과는 OS 기본 Alert 대신 앱 UI 다이얼로그로 띄운다.
  const { dialog, ask, notify } = useConfirmDialog();

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
  const delImage = useDeleteTravelImage(travelIdx);

  // 히어로의 'KTX 티켓 정보 추가하기' → 승차권 화면(저장된 게 있으면 목록, 없으면 폼).
  const [ticketOpen, setTicketOpen] = useState(false);

  // ⋮(또는 길게 누르기)로 연 항목 메뉴의 대상.
  const [menuTarget, setMenuTarget] = useState<{
    item: TravelScheduleItem;
    dayNo: number;
  } | null>(null);

  /**
   * 사진을 붙일 일정(schedule_idx). 값이 있으면 촬영/갤러리 선택 시트가 열린다.
   * 일정을 지정해 올리므로 사진에 좌표가 없어도 그 일정에 그대로 붙는다.
   */
  const [photoTarget, setPhotoTarget] = useState<number | null>(null);
  const addImages = useAddTravelImages();
  /**
   * 업로드 중인 사진 — 그 일정의 썸네일 줄에 흐린 미리보기 + 스피너로 먼저 보여준다.
   * 서버 응답을 기다리는 동안 아무 반응이 없으면 눌린 건지 알 수 없다.
   */
  const [pendingPhoto, setPendingPhoto] = useState<{
    scheduleIdx: number;
    uri: string;
  } | null>(null);

  const onPickPhoto = async (source: MediaSource) => {
    const scheduleIdx = photoTarget;
    setPhotoTarget(null);
    if (scheduleIdx == null) return;

    const photo = await pickScenicPhoto(source, { requireLocation: false });
    if (!photo) return; // 취소·권한 거부

    setPendingPhoto({ scheduleIdx, uri: photo.uri });
    addImages.mutate(
      { travelIdx, photos: [photo], scheduleIdx },
      {
        onError: (e) =>
          Alert.alert("사진 등록 실패", describeScheduleError(e)),
        // 성공이든 실패든 미리보기를 걷는다(성공 시 갱신된 목록이 대신 그려진다).
        onSettled: () => setPendingPhoto(null),
      },
    );
  };

  /** 일정에 붙인 사진 1장 삭제 — 저장소에서도 지워져 되돌릴 수 없다. */
  const confirmDeleteImage = (image: TravelScheduleImage) => {
    ask({
      title: "사진을 삭제할까요?",
      message: "이 일정에서 사진이 사라지고 되돌릴 수 없어요.",
      confirmLabel: "삭제하기",
      danger: true,
      onConfirm: () =>
        delImage.mutate(image.image_idx, {
          // 실패 안내도 같은 다이얼로그로 이어 띄운다(확인을 누르면 교체된다).
          onError: (e) =>
            notify({ title: "사진 삭제 실패", message: describeScheduleError(e) }),
        }),
    });
  };

  const confirmDeleteItem = (item: TravelScheduleItem) => {
    Alert.alert(
      "일정을 삭제할까요?",
      `'${item.title || "이 일정"}'이 삭제되고 되돌릴 수 없어요.`,
      [
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
      ],
    );
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
  // 다녀온 여행은 기록 열람용 — 일정 추가/티켓 등록·실시간 풍경은 의미가 없어 감춘다.
  const completed = data.status === "COMPLETED";

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
          // 다녀온 여행에서는 같은 자리가 '내 여행 영상 만들기' — 옵션 화면으로 보낸다.
          onAction={
            completed
              ? () =>
                  router.push({
                    pathname: "/travel/video",
                    params: { travelIdx, travelTitle: data.title },
                  })
              : () => setTicketOpen(true)
          }
          actionKind={completed ? "video" : "ticket"}
        />

        {/* 실시간 창밖 풍경 — 탑승 상태 표시. 열차 항목이 없으면 안 뜬다. */}
        {completed ? null : <LiveScenerySection detail={data} />}

        {/* 열차 출발 시각에 시스템 창이 불쑥 뜨지 않도록 여기서 미리 권한을 받아둔다.
            이미 허용됐거나 앱 실행 중 한 번 물어봤으면 아무것도 렌더하지 않는다. */}
        {completed ? null : <LocationPermissionPrompt />}

        <View style={{ paddingHorizontal: scale(20), marginTop: verticalScale(4) }}>
          {data.days.length === 0 ? (
            <EmptyDays
              onAdd={completed ? undefined : () => setAddState({ kind: "visit" })}
            />
          ) : (
            data.days.map((day) => (
              <DaySection
                key={day.day_no}
                day={day}
                onAdd={
                  completed
                    ? undefined
                    : () => setAddState({ kind: "visit", dayNo: day.day_no })
                }
                // 다녀온 여행은 기록 열람용 → 항목 편집/삭제 진입도 막는다.
                onItemMenu={
                  completed
                    ? undefined
                    : (item) => setMenuTarget({ item, dayNo: day.day_no })
                }
                onDeleteImage={completed ? undefined : confirmDeleteImage}
                onAddPhoto={completed ? undefined : setPhotoTarget}
                pendingPhoto={pendingPhoto}
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
      {ticketOpen ? (
        <TicketWalletModal
          travelIdx={travelIdx}
          onClose={() => setTicketOpen(false)}
        />
      ) : null}

      {/* 촬영하기 / 갤러리에서 선택 — 풍경알림 카드와 같은 시트를 그대로 쓴다. */}
      <MediaSourceSheet
        visible={photoTarget != null}
        onSelect={onPickPhoto}
        onClose={() => setPhotoTarget(null)}
      />

      <ScheduleItemMenuSheet
        visible={!!menuTarget}
        title={menuTarget?.item.title || "일정"}
        onClose={() => setMenuTarget(null)}
        onAddPhoto={() => {
          const t = menuTarget;
          setMenuTarget(null);
          if (t) setPhotoTarget(t.item.schedule_idx);
        }}
        onEdit={() => {
          const t = menuTarget;
          setMenuTarget(null);
          if (t) setEditTarget(t);
        }}
        onDelete={() => {
          const t = menuTarget;
          setMenuTarget(null);
          if (t) confirmDeleteItem(t.item);
        }}
      />

      {editTarget ? (
        <EditScheduleModal
          visible
          onClose={() => setEditTarget(null)}
          travelIdx={travelIdx}
          item={editTarget.item}
          dayNo={editTarget.dayNo}
        />
      ) : null}

      {dialog}
    </>
  );
}

/** 일정이 하나도 없을 때 — 안내 + 추가 버튼(다녀온 여행이면 버튼 없음). */
function EmptyDays({ onAdd }: { onAdd?: () => void }) {
  return (
    <View style={{ paddingVertical: verticalScale(32), alignItems: "center" }}>
      <Text
        className="text-gray-400"
        style={{ fontSize: moderateScale(14), marginBottom: verticalScale(16) }}
      >
        등록된 일정이 없어요
      </Text>
      {onAdd ? <AddButton onPress={onAdd} /> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 히어로 — 커버 이미지 안에 제목/기간 + 티켓 추가 카드 (+ 뒤로)          */
/* ------------------------------------------------------------------ */
/** 히어로 하단 카드의 성격 — 예정: 티켓 등록 / 다녀온: 여행 영상 만들기. */
type HeroActionKind = "ticket" | "video";

function Hero({
  travel,
  coverUri,
  onBack,
  onAction,
  actionKind,
}: {
  travel: TravelDetail;
  coverUri: string | null;
  onBack?: () => void;
  /** 없으면 카드가 '준비 중'으로 비활성 표시된다. */
  onAction?: () => void;
  actionKind: HeroActionKind;
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
              // 히어로 위에 떠 있지만 다른 화면 상단바와 같은 높이에 오도록 맞춘다.
              top: HEADER_TOP_GAP,
              height: HEADER_HEIGHT,
              width: scale(28),
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
          <HeroActionCard kind={actionKind} onPress={onAction} />
        </View>
      </ImageBackground>
    </View>
  );
}

/**
 * 커버 이미지 안, 제목/기간 바로 아래 놓이는 액션 카드.
 * 예정된 여행이면 티켓 등록, 다녀온 여행이면 여행 영상 만들기로 문구·아이콘이 바뀐다.
 * onPress 가 없으면 메뉴 시트와 같은 방식으로 '준비 중' 비활성 표시.
 */
function HeroActionCard({
  kind,
  onPress,
}: {
  kind: HeroActionKind;
  onPress?: () => void;
}) {
  const video = kind === "video";
  const label = video ? "내 여행 영상 만들기" : "KTX 티켓 정보 추가하기";
  const disabled = !onPress;
  const tint = disabled ? "#C4C4C4" : ACCENT;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
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
      accessibilityLabel={label}
    >
      {video ? (
        <PlayIcon
          color={tint}
          width={moderateScale(22)}
          height={moderateScale(22)}
        />
      ) : (
        <TicketIcon width={moderateScale(26)} height={moderateScale(26)} />
      )}
      <Text
        className="flex-1 font-bold"
        style={{ fontSize: moderateScale(14), color: disabled ? "#9CA3AF" : "#1F2937" }}
      >
        {label}
        {disabled ? (
          <Text
            className="font-medium"
            style={{ fontSize: moderateScale(12), color: "#C4C4C4" }}
          >
            {"  준비 중"}
          </Text>
        ) : null}
      </Text>
      {disabled ? null : (
        <Feather
          name={video ? "chevron-right" : "plus"}
          size={moderateScale(20)}
          color={ACCENT}
        />
      )}
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
  onDeleteImage,
  onAddPhoto,
  pendingPhoto,
}: {
  day: TravelDay;
  /** 없으면 '일정 추가' 버튼을 그리지 않는다(다녀온 여행). */
  onAdd?: () => void;
  /** 없으면 항목 ⋮ 도 그리지 않는다(다녀온 여행). */
  onItemMenu?: (item: TravelScheduleItem) => void;
  /** 없으면 사진 썸네일의 X(삭제)를 그리지 않는다. */
  onDeleteImage?: (image: TravelScheduleImage) => void;
  /** 썸네일 옆 + 로 사진 추가. 없으면 그리지 않는다. */
  onAddPhoto?: (scheduleIdx: number) => void;
  /** 업로드 중인 사진(해당 일정에만 미리보기로 붙는다). */
  pendingPhoto?: { scheduleIdx: number; uri: string } | null;
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
          <Fragment key={`${row.item.schedule_idx}-${row.t}`}>
            <TimelineRow
              row={row}
              number={number}
              isLast={i === rows.length - 1}
              onMenu={onItemMenu ? () => onItemMenu(row.item) : undefined}
              onDeleteImage={onDeleteImage}
              onAddPhoto={
                onAddPhoto ? () => onAddPhoto(row.item.schedule_idx) : undefined
              }
              pendingPhotoUri={
                pendingPhoto?.scheduleIdx === row.item.schedule_idx
                  ? pendingPhoto.uri
                  : null
              }
            />
            {/* 탑승 중인 구간이면 승차 ↔ 하차 사이에 실시간 창밖 풍경을 끼운다.
                탑승 중이 아니면 컴포넌트가 스스로 null 을 돌려준다. */}
            {row.t === "board" ? (
              <ScenicTimelineRow
                scheduleIdx={row.item.schedule_idx}
                railWidth={RAIL_W}
                railGap={RAIL_GAP}
                railColor={RAIL_LINE}
              />
            ) : null}
          </Fragment>
        );
      })}

      {onAdd ? <AddButton onPress={onAdd} /> : null}
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
  onMenu,
  onDeleteImage,
  onAddPhoto,
  pendingPhotoUri,
}: {
  row: Row;
  number: number | null;
  isLast: boolean;
  /** 없으면 ⋮·길게 누르기 모두 비활성(다녀온 여행). */
  onMenu?: () => void;
  /** 없으면 사진 썸네일의 X(삭제) 버튼을 그리지 않는다. */
  onDeleteImage?: (image: TravelScheduleImage) => void;
  /** 썸네일 옆 + 버튼. 없으면 그리지 않는다. */
  onAddPhoto?: () => void;
  /** 이 일정에 업로드 중인 사진의 로컬 URI. 없으면 null. */
  pendingPhotoUri?: string | null;
}) {
  const hasMenu = !!onMenu;
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
            // 번호 노드 테두리도 아래로 이어지는 연결선과 같은 회색(숫자만 민트).
            borderColor: number != null ? RAIL_LINE : HOLLOW_RING,
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

      {/* 카드 — 길게 눌러도 편집/삭제 메뉴 */}
      <Pressable
        onLongPress={onMenu}
        disabled={!onMenu}
        delayLongPress={350}
        className="active:opacity-80"
        style={{ flex: 1, paddingBottom: verticalScale(12) }}
      >
        {row.t === "board" ? (
          <BoardCard item={row.item} hasMenu={hasMenu} />
        ) : row.t === "alight" ? (
          <AlightCard item={row.item} hasMenu={hasMenu} />
        ) : (
          <PlaceCard item={row.item} hasMenu={hasMenu} />
        )}

        {/* 이 일정에 붙인 사용자 사진들. 하차 줄은 승차 줄과 같은 항목이라 건너뛴다
            (안 그러면 같은 사진이 두 번 나온다). */}
        {row.t !== "alight" &&
        ((row.item.images?.length ?? 0) > 0 || pendingPhotoUri) ? (
          <SchedulePhotos
            images={row.item.images ?? []}
            onDelete={onDeleteImage}
            onAdd={onAddPhoto}
            pendingUri={pendingPhotoUri}
          />
        ) : null}

        {/* 편집/삭제 진입점. 길게 누르기만으론 아무도 못 찾아서 ⋮ 를 항상 보여준다.
            카드 우측 상단에 얹고, 겹칠 수 있는 텍스트에는 MENU_INSET 만큼 여백을 준다. */}
        {onMenu ? (
          <Pressable
            onPress={onMenu}
            hitSlop={10}
            className="active:opacity-60"
            style={{
              position: "absolute",
              right: scale(6),
              top: verticalScale(8),
              padding: scale(4),
            }}
            accessibilityRole="button"
            accessibilityLabel="일정 메뉴"
          >
            <Feather
              name="more-vertical"
              size={moderateScale(16)}
              color="#9CA3AF"
            />
          </Pressable>
        ) : null}
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 일정에 붙인 사용자 사진 — 가로 스크롤 썸네일 + X(삭제)                  */
/* ------------------------------------------------------------------ */
const PHOTO = scale(64);
const PHOTO_X = scale(18);

function SchedulePhotos({
  images,
  onDelete,
  onAdd,
  pendingUri,
}: {
  images: TravelScheduleImage[];
  onDelete?: (image: TravelScheduleImage) => void;
  /** 없으면 + 타일을 그리지 않는다(다녀온 여행). */
  onAdd?: () => void;
  /** 업로드 중인 사진의 로컬 URI — 흐리게 + 스피너로 먼저 보여준다. */
  pendingUri?: string | null;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // 부모가 길게 누르기(메뉴)를 받고 있어 가로 스크롤이 먹히도록 여기서 끊는다.
      onStartShouldSetResponder={() => true}
      contentContainerStyle={{
        gap: scale(8),
        paddingTop: verticalScale(8),
        // X 버튼이 썸네일 위로 반쯤 나와 잘리지 않게.
        paddingRight: scale(6),
      }}
    >
      {images.map((image) => (
        <View key={image.image_idx} style={{ width: PHOTO, height: PHOTO }}>
          <Image
            source={{ uri: image.url }}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: scale(8),
              backgroundColor: CARD_BG,
            }}
            contentFit="cover"
            transition={150}
          />
          {onDelete ? (
            <Pressable
              onPress={() => onDelete(image)}
              hitSlop={8}
              className="items-center justify-center rounded-full active:opacity-70"
              style={{
                position: "absolute",
                top: -PHOTO_X / 3,
                right: -PHOTO_X / 3,
                width: PHOTO_X,
                height: PHOTO_X,
                backgroundColor: "rgba(0,0,0,0.6)",
              }}
              accessibilityRole="button"
              accessibilityLabel="사진 삭제"
            >
              <Feather name="x" size={moderateScale(11)} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>
      ))}

      {/* 업로드 중 — 방금 고른 사진을 흐리게 깔고 그 위에 스피너를 돌린다. */}
      {pendingUri ? (
        <View style={{ width: PHOTO, height: PHOTO }}>
          <Image
            source={{ uri: pendingUri }}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: scale(8),
              opacity: 0.4,
            }}
            contentFit="cover"
          />
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ borderRadius: scale(8), backgroundColor: "rgba(0,0,0,0.15)" }}
          >
            <ActivityIndicator color={ACCENT} />
          </View>
        </View>
      ) : null}

      {/* 사진이 이미 있을 때의 추가 진입점 — ⋮ 메뉴까지 안 가도 되게 옆에 둔다. */}
      {onAdd ? (
        <Pressable
          onPress={onAdd}
          className="items-center justify-center active:opacity-70"
          style={{
            width: PHOTO,
            height: PHOTO,
            borderRadius: scale(8),
            borderWidth: 1,
            borderColor: "#D9DCE1",
            backgroundColor: "#FFFFFF",
          }}
          accessibilityRole="button"
          accessibilityLabel="사진 추가"
        >
          <Feather name="plus" size={moderateScale(20)} color="#9CA3AF" />
        </Pressable>
      ) : null}
    </ScrollView>
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

/**
 * 카드 우측 상단 ⋮ 와 겹치지 않도록 첫 줄 텍스트에 주는 여백.
 * 이미지·메모처럼 ⋮ 아래에 있는 요소에는 적용하지 않는다(가운데 정렬이 틀어지므로).
 */
const MENU_INSET = scale(24);

function BoardCard({
  item,
  hasMenu,
}: {
  item: TravelScheduleItem;
  hasMenu?: boolean;
}) {
  const inset = hasMenu ? MENU_INSET : 0;
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
          style={{
            color: ACCENT,
            fontSize: moderateScale(12),
            paddingRight: inset,
          }}
        >
          {route}
        </Text>
      ) : null}

      <View
        className="flex-row items-center"
        style={{
          gap: scale(6),
          marginTop: verticalScale(route ? 8 : 0),
          paddingRight: route ? 0 : inset,
        }}
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

function AlightCard({
  item,
  hasMenu,
}: {
  item: TravelScheduleItem;
  hasMenu?: boolean;
}) {
  const inset = hasMenu ? MENU_INSET : 0;
  const end = formatClockTime(item.end_time);
  const arr = item.arr_station ?? "";
  return (
    <Card>
      {end ? (
        <Text
          className="font-semibold"
          style={{
            color: ACCENT,
            fontSize: moderateScale(13),
            paddingRight: inset,
          }}
        >
          {end}
        </Text>
      ) : null}
      <Text
        className="font-bold text-gray-900"
        style={{
          fontSize: moderateScale(16),
          marginTop: verticalScale(end ? 4 : 0),
          paddingRight: end ? 0 : inset,
        }}
      >
        {arr ? `${arr} 하차` : item.title}
      </Text>
    </Card>
  );
}

function PlaceCard({
  item,
  hasMenu,
}: {
  item: TravelScheduleItem;
  hasMenu?: boolean;
}) {
  const inset = hasMenu ? MENU_INSET : 0;
  const start = formatClockTime(item.start_time);
  return (
    <Card>
      {start ? (
        <Text
          className="font-semibold"
          style={{
            color: ACCENT,
            fontSize: moderateScale(13),
            paddingRight: inset,
          }}
        >
          {start}
        </Text>
      ) : null}
      <Text
        className="font-bold text-gray-900"
        style={{
          fontSize: moderateScale(16),
          marginTop: verticalScale(start ? 4 : 0),
          // 시각이 있으면 ⋮ 는 그 줄 옆이라 제목까지 밀 필요가 없다.
          paddingRight: start ? 0 : inset,
        }}
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
