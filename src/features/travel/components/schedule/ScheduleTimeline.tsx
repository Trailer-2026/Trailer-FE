import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { Fragment, memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  View,
} from "react-native";

import { useConfirmDialog } from "@/src/components/ConfirmDialog";
import { Text } from "@/src/components/Text";
import MediaSourceSheet, {
  type MediaSource,
} from "@/src/features/reels/components/MediaSourceSheet";
import { pickScenicPhoto } from "@/src/features/scenic/capture";
import ScenicTimelineRow from "@/src/features/scenic/components/ScenicTimelineRow";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { describeScheduleError } from "../../errors";
import { formatClockTime, formatDayDate } from "../../format";
import {
  useAddTravelImages,
  useDeleteSchedule,
  useDeleteTravelImage,
} from "../../queries";
import type {
  TravelDay,
  TravelScheduleImage,
  TravelScheduleItem,
} from "../../types";
import AddScheduleModal, { type ScheduleKind } from "./AddScheduleModal";
import EditScheduleModal from "./EditScheduleModal";
import ScheduleItemMenuSheet from "./ScheduleItemMenuSheet";

const ACCENT = "#5E84F4";
const MINT = "#34C6A8"; // 타임라인 번호 노드
const CARD_BG = "#F4F4F6";
const RAIL_LINE = "#D9DCE1";
const HOLLOW_RING = "#D1D5DB";

const KTX_LOGO = require("../../../../../assets/images/style/ktx.png");

const RAIL_W = scale(30);
const RAIL_GAP = scale(12);

type PendingPhoto = { scheduleIdx: number; uri: string };

/**
 * 일자별 타임라인 + 항목 추가/편집/삭제/사진 모달.
 *
 * 모달 상태(추가 폼·편집 폼·⋮ 메뉴·사진 선택 시트·업로드 미리보기)를 전부 여기서
 * 갖는다 — 상세 화면(TravelDetailView)에 두면 시트 하나 여닫을 때마다 히어로·실시간
 * 풍경까지 화면 전체가 다시 그려진다. 여기서도 DaySection 은 memo 라, 모달 상태가
 * 바뀌어도 props 가 같은 날짜 섹션은 렌더를 건너뛴다. 그래서 아래 핸들러는 전부
 * useCallback 으로 고정하고, 날짜별로 달라지는 값(dayNo·item)은 인자로 받는다.
 *
 * 모달들은 RN Modal(별도 창) 이라 ScrollView 안쪽에 렌더돼도 레이아웃을 차지하지 않는다.
 */
export default function ScheduleTimeline({
  travelIdx,
  days,
  readOnly,
  focusScheduleIdx,
  onFocusDayLayout,
  onFocusRowLayout,
}: {
  travelIdx: number;
  days: TravelDay[];
  /** 다녀온 여행 — 기록 열람용이라 추가/편집/삭제/사진 진입점을 모두 감춘다. */
  readOnly: boolean;
  /** 자동 스크롤 대상 일정. null 이면 아무 것도 재지 않는다. */
  focusScheduleIdx: number | null;
  onFocusDayLayout: (e: LayoutChangeEvent) => void;
  onFocusRowLayout: (e: LayoutChangeEvent) => void;
}) {
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
  /**
   * 업로드 중인 사진 — 그 일정의 썸네일 줄에 흐린 미리보기 + 스피너로 먼저 보여준다.
   * 서버 응답을 기다리는 동안 아무 반응이 없으면 눌린 건지 알 수 없다.
   */
  const [pendingPhoto, setPendingPhoto] = useState<PendingPhoto | null>(null);

  // mutation 결과 객체는 렌더마다 바뀌지만 mutate 자체는 고정이라 그것만 꺼내 쓴다.
  const { mutate: deleteSchedule } = useDeleteSchedule(travelIdx);
  const { mutate: deleteImage } = useDeleteTravelImage(travelIdx);
  const { mutate: addImages } = useAddTravelImages();

  const openAdd = useCallback(
    (dayNo?: number) => setAddState({ kind: "visit", dayNo }),
    [],
  );
  const openMenu = useCallback(
    (item: TravelScheduleItem, dayNo: number) => setMenuTarget({ item, dayNo }),
    [],
  );

  /** 일정에 붙인 사진 1장 삭제 — 저장소에서도 지워져 되돌릴 수 없다. */
  const confirmDeleteImage = useCallback(
    (image: TravelScheduleImage) => {
      ask({
        title: "사진을 삭제할까요?",
        message: "이 일정에서 사진이 사라지고 되돌릴 수 없어요.",
        confirmLabel: "삭제하기",
        danger: true,
        onConfirm: () =>
          deleteImage(image.image_idx, {
            // 실패 안내도 같은 다이얼로그로 이어 띄운다(확인을 누르면 교체된다).
            onError: (e) =>
              notify({ title: "사진 삭제 실패", message: describeScheduleError(e) }),
          }),
      });
    },
    [ask, notify, deleteImage],
  );

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
            deleteSchedule(item.schedule_idx, {
              onError: (e) =>
                Alert.alert("삭제 실패", describeScheduleError(e)),
            }),
        },
      ],
    );
  };

  const onPickPhoto = async (source: MediaSource) => {
    const scheduleIdx = photoTarget;
    setPhotoTarget(null);
    if (scheduleIdx == null) return;

    const photo = await pickScenicPhoto(source, { requireLocation: false });
    if (!photo) return; // 취소·권한 거부

    setPendingPhoto({ scheduleIdx, uri: photo.uri });
    addImages(
      { travelIdx, photos: [photo], scheduleIdx },
      {
        onError: (e) =>
          Alert.alert("사진 등록 실패", describeScheduleError(e)),
        // 성공이든 실패든 미리보기를 걷는다(성공 시 갱신된 목록이 대신 그려진다).
        onSettled: () => setPendingPhoto(null),
      },
    );
  };

  return (
    <>
      {days.length === 0 ? (
        <EmptyDays onAdd={readOnly ? undefined : openAdd} />
      ) : (
        days.map((day) => (
          <DaySection
            key={day.day_no}
            day={day}
            onAdd={readOnly ? undefined : openAdd}
            onItemMenu={readOnly ? undefined : openMenu}
            onDeleteImage={readOnly ? undefined : confirmDeleteImage}
            onAddPhoto={readOnly ? undefined : setPhotoTarget}
            // 업로드 중인 사진이 붙을 날짜에만 넘긴다 — 나머지 날짜는 props 가 그대로라
            // memo 가 렌더를 건너뛴다.
            pendingPhoto={
              pendingPhoto &&
              day.items.some((i) => i.schedule_idx === pendingPhoto.scheduleIdx)
                ? pendingPhoto
                : null
            }
            focusScheduleIdx={focusScheduleIdx}
            onFocusDayLayout={onFocusDayLayout}
            onFocusRowLayout={onFocusRowLayout}
          />
        ))
      )}

      {addState ? (
        <AddScheduleModal
          visible
          onClose={() => setAddState(null)}
          travelIdx={travelIdx}
          kind={addState.kind}
          initialDayNo={addState.dayNo}
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

/**
 * 하루치 섹션. memo — 형제 날짜의 사진 업로드나 모달 여닫기로는 다시 그리지 않는다.
 * 그래서 콜백은 날짜/항목을 인자로 받는 고정 함수로 받고, 여기서 dayNo 를 묶는다.
 */
const DaySection = memo(function DaySection({
  day,
  onAdd,
  onItemMenu,
  onDeleteImage,
  onAddPhoto,
  pendingPhoto,
  focusScheduleIdx,
  onFocusDayLayout,
  onFocusRowLayout,
}: {
  day: TravelDay;
  /** 없으면 '일정 추가' 버튼을 그리지 않는다(다녀온 여행). */
  onAdd?: (dayNo: number) => void;
  /** 없으면 항목 ⋮ 도 그리지 않는다(다녀온 여행). */
  onItemMenu?: (item: TravelScheduleItem, dayNo: number) => void;
  /** 없으면 사진 썸네일의 X(삭제)를 그리지 않는다. */
  onDeleteImage?: (image: TravelScheduleImage) => void;
  /** 썸네일 옆 + 로 사진 추가. 없으면 그리지 않는다. */
  onAddPhoto?: (scheduleIdx: number) => void;
  /** 업로드 중인 사진(이 날짜의 일정에 붙을 때만 넘어온다). */
  pendingPhoto: PendingPhoto | null;
  /** 자동 스크롤 대상 일정. null 이면 아무 것도 재지 않는다. */
  focusScheduleIdx: number | null;
  onFocusDayLayout: (e: LayoutChangeEvent) => void;
  onFocusRowLayout: (e: LayoutChangeEvent) => void;
}) {
  const dayNo = day.day_no;
  // 대상 일정이 이 날짜에 있을 때만 위치를 잰다.
  const hasFocus =
    focusScheduleIdx != null &&
    day.items.some((i) => i.schedule_idx === focusScheduleIdx);
  // 시간순으로 보여준다(서버 sequence 순 대신). train 은 승차/하차가 한 묶음으로 이동.
  // 행 객체를 고정해 두어야 TimelineRow 의 memo 가 먹는다.
  const rows = useMemo(() => toRows(sortByStartTime(day.items)), [day.items]);

  const onAddPress = useMemo(
    () => (onAdd ? () => onAdd(dayNo) : undefined),
    [onAdd, dayNo],
  );
  const onMenu = useMemo(
    () =>
      onItemMenu
        ? (item: TravelScheduleItem) => onItemMenu(item, dayNo)
        : undefined,
    [onItemMenu, dayNo],
  );

  // 승차/장소 노드에만 순번을 매기고 하차는 빈 노드로 둔다.
  let seq = 0;

  return (
    <View
      style={{ marginTop: verticalScale(20) }}
      onLayout={hasFocus ? onFocusDayLayout : undefined}
    >
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
            Day {dayNo}
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
              onMenu={onMenu}
              onDeleteImage={onDeleteImage}
              onAddPhoto={onAddPhoto}
              pendingPhotoUri={
                pendingPhoto?.scheduleIdx === row.item.schedule_idx
                  ? pendingPhoto.uri
                  : null
              }
              // 열차는 승차/하차 두 행으로 펼쳐지므로 승차 행만 잰다
              // (하차 행까지 재면 나중 것이 먼저 것을 덮어쓴다).
              onFocusLayout={
                row.t !== "alight" && focusScheduleIdx === row.item.schedule_idx
                  ? onFocusRowLayout
                  : undefined
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

      {onAddPress ? <AddButton onPress={onAddPress} /> : null}
    </View>
  );
});

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

/** 타임라인 한 줄. memo — 같은 날짜의 다른 항목에 사진이 올라가도 다시 그리지 않는다. */
const TimelineRow = memo(function TimelineRow({
  row,
  number,
  isLast,
  onMenu,
  onDeleteImage,
  onAddPhoto,
  pendingPhotoUri,
  onFocusLayout,
}: {
  row: Row;
  number: number | null;
  isLast: boolean;
  /** 없으면 ⋮·길게 누르기 모두 비활성(다녀온 여행). */
  onMenu?: (item: TravelScheduleItem) => void;
  /** 없으면 사진 썸네일의 X(삭제) 버튼을 그리지 않는다. */
  onDeleteImage?: (image: TravelScheduleImage) => void;
  /** 썸네일 옆 + 버튼. 없으면 그리지 않는다. */
  onAddPhoto?: (scheduleIdx: number) => void;
  /** 이 일정에 업로드 중인 사진의 로컬 URI. 없으면 null. */
  pendingPhotoUri: string | null;
  /** 자동 스크롤 대상일 때만 넘어온다 — 레이아웃이 끝나면 이 행의 위치를 알린다. */
  onFocusLayout?: (e: LayoutChangeEvent) => void;
}) {
  const { item } = row;
  const hasMenu = !!onMenu;
  const openMenu = onMenu ? () => onMenu(item) : undefined;
  const addPhoto = onAddPhoto ? () => onAddPhoto(item.schedule_idx) : undefined;

  return (
    <View style={{ flexDirection: "row" }} onLayout={onFocusLayout}>
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
        onLongPress={openMenu}
        disabled={!openMenu}
        delayLongPress={350}
        className="active:opacity-80"
        style={{ flex: 1, paddingBottom: verticalScale(12) }}
      >
        {row.t === "board" ? (
          <BoardCard item={item} hasMenu={hasMenu} />
        ) : row.t === "alight" ? (
          <AlightCard item={item} hasMenu={hasMenu} />
        ) : (
          <PlaceCard item={item} hasMenu={hasMenu} />
        )}

        {/* 이 일정에 붙인 사용자 사진들. 하차 줄은 승차 줄과 같은 항목이라 건너뛴다
            (안 그러면 같은 사진이 두 번 나온다). */}
        {row.t !== "alight" &&
        ((item.images?.length ?? 0) > 0 || pendingPhotoUri) ? (
          <SchedulePhotos
            images={item.images ?? []}
            onDelete={onDeleteImage}
            onAdd={addPhoto}
            pendingUri={pendingPhotoUri}
          />
        ) : null}

        {/* 편집/삭제 진입점. 길게 누르기만으론 아무도 못 찾아서 ⋮ 를 항상 보여준다.
            카드 우측 상단에 얹고, 겹칠 수 있는 텍스트에는 MENU_INSET 만큼 여백을 준다. */}
        {openMenu ? (
          <Pressable
            onPress={openMenu}
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
});

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
