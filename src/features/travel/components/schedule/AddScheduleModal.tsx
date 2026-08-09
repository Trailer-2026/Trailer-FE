import { ActivityIndicator, Alert, Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import type { PlaceSearchResult } from "@/src/features/place/types";
import {
  buildSelectableDays,
  type TravelDayOption,
} from "@/src/features/travel/days";
import { describeScheduleError } from "@/src/features/travel/errors";
import {
  useCreateSchedule,
  useTravelDetail,
} from "@/src/features/travel/queries";
import type { ScheduleCreateRequest } from "@/src/features/travel/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { formatDayDate } from "../../format";
import {
  ACCENT,
  ChipSelect,
  Field,
  ModalShell,
  TimeField,
  isValidTime,
  toApiTime,
} from "./parts";
import PlaceSearchField from "./PlaceSearchField";

/** 추가할 항목 종류. 호출부가 곧바로 지정한다(중간 선택 시트 없음). */
export type ScheduleKind = "visit" | "train";

/**
 * 일정 항목 추가 폼. `kind` 로 장소/티켓 폼이 바로 열린다.
 * 장소는 검색으로 좌표를 채우고, 티켓은 출발/도착일·시각·열차 정보를 입력한다.
 *
 * 날짜 칩에 쓸 `days` 는 travelIdx 로 직접 조회한다(호출부가 넘기지 않음).
 * → 일정표 상세의 티켓 카드와 '내 일정' 탭 헤더의 승차권 아이콘 등 진입점이 달라도
 *   항상 같은 캐시(travelKeys.detail)를 보고 동일한 화면이 뜬다.
 */
export default function AddScheduleModal({
  visible,
  onClose,
  travelIdx,
  kind,
  initialDayNo,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  travelIdx: number;
  kind: ScheduleKind;
  initialDayNo?: number;
  onSaved?: () => void;
}) {
  const create = useCreateSchedule(travelIdx);
  // 상세 화면에서 열면 이미 캐시가 있어 즉시, 탭 헤더에서 열면 프리페치분을 재사용한다.
  const { data, isLoading } = useTravelDetail(visible ? travelIdx : undefined);

  const submit = (body: ScheduleCreateRequest) => {
    create.mutate(body, {
      onSuccess: () => {
        onSaved?.();
        onClose();
      },
      onError: (e) => Alert.alert("추가 실패", describeScheduleError(e)),
    });
  };

  if (!visible) return null;

  const title = kind === "train" ? "티켓 정보 추가하기" : "장소 추가";

  // 캐시가 비어 있는 진입점(탭 헤더 등)에서 첫 조회 중일 때.
  if (isLoading || !data) return <LoadingSheet title={title} onClose={onClose} />;

  // 선택지는 여행 기간에서 만든다 — 상세의 days 는 항목이 있는 날만 올 수 있어서
  // 방금 만든 빈 여행에서는 고를 날짜가 하나도 없게 된다.
  const days = buildSelectableDays(data);

  if (kind === "visit") {
    return (
      <VisitForm
        days={days}
        initialDayNo={initialDayNo}
        saving={create.isPending}
        onClose={onClose}
        onSubmit={submit}
      />
    );
  }
  return (
    <TrainForm
      days={days}
      saving={create.isPending}
      onClose={onClose}
      onSubmit={submit}
    />
  );
}

/** 일정표를 아직 못 받아온 동안 잠깐 뜨는 로딩 화면(탭에서 눌러 바로 열 때). */
function LoadingSheet({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
        {/* 폼이 뜬 뒤와 헤더가 튀지 않도록 ModalShell 의 back 헤더와 같은 여백/크기. */}
        <View
          className="flex-row items-center"
          style={{
            paddingHorizontal: scale(20),
            paddingTop: verticalScale(16),
            paddingBottom: verticalScale(10),
          }}
        >
          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="active:opacity-60"
            style={{ padding: scale(4) }}
            accessibilityRole="button"
            accessibilityLabel="뒤로"
          >
            <BackIcon width={moderateScale(12)} height={moderateScale(17)} />
          </Pressable>
          <Text
            className="font-bold text-gray-900"
            style={{ fontSize: moderateScale(17), marginLeft: scale(8) }}
          >
            {title}
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ACCENT} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* 장소(visit) 폼                                                       */
/* ------------------------------------------------------------------ */
function VisitForm({
  days,
  initialDayNo,
  saving,
  onClose,
  onSubmit,
}: {
  days: TravelDayOption[];
  initialDayNo?: number;
  saving: boolean;
  onClose: () => void;
  onSubmit: (body: ScheduleCreateRequest) => void;
}) {
  const [place, setPlace] = useState<PlaceSearchResult | null>(null);
  const [dayNo, setDayNo] = useState<number | null>(
    initialDayNo ?? days[0]?.day_no ?? null,
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [memo, setMemo] = useState("");

  const dayOptions = days.map((d) => ({
    value: d.day_no,
    label: `Day ${d.day_no} · ${formatDayDate(d.date)}`,
  }));

  const endOk = endTime === "" || isValidTime(endTime);
  const canSave =
    !!place && dayNo != null && isValidTime(startTime) && endOk;

  const handleSave = () => {
    if (!place || dayNo == null) return;
    onSubmit({
      kind: "visit",
      day_no: dayNo,
      title: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      start_time: toApiTime(startTime),
      ...(endTime ? { end_time: toApiTime(endTime) } : {}),
      ...(memo.trim() ? { memo: memo.trim() } : {}),
    });
  };

  return (
    <ModalShell
      visible
      leading="back"
      title="장소 추가"
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      canSave={canSave}
    >
      <PlaceSearchField selected={place} onSelect={setPlace} />
      <ChipSelect
        label="날짜"
        required
        options={dayOptions}
        selected={dayNo}
        onSelect={setDayNo}
      />
      <TimeField
        label="방문 시각"
        required
        value={startTime}
        onChangeText={setStartTime}
      />
      <TimeField label="종료 시각(선택)" value={endTime} onChangeText={setEndTime} />
      <Field
        label="메모(선택)"
        value={memo}
        onChangeText={setMemo}
        placeholder="메모를 입력하세요"
        multiline
      />
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* 티켓(train) 폼                                                       */
/* ------------------------------------------------------------------ */
function TrainForm({
  days,
  saving,
  onClose,
  onSubmit,
}: {
  days: TravelDayOption[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (body: ScheduleCreateRequest) => void;
}) {
  const dateOptions = days.map((d) => ({
    value: d.date,
    label: formatDayDate(d.date),
  }));

  const [depDate, setDepDate] = useState<string | null>(days[0]?.date ?? null);
  const [arrDate, setArrDate] = useState<string | null>(days[0]?.date ?? null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [trainNo, setTrainNo] = useState("");
  const [trainGrade, setTrainGrade] = useState("");
  const [depStation, setDepStation] = useState("");
  const [arrStation, setArrStation] = useState("");
  const [carNo, setCarNo] = useState("");
  const [seatNo, setSeatNo] = useState("");
  const [memo, setMemo] = useState("");

  // 서버가 kind=train 에서 요구하는 필수값 전부(누락 시 400).
  const canSave =
    !!depDate &&
    !!arrDate &&
    isValidTime(startTime) &&
    isValidTime(endTime) &&
    depStation.trim() !== "" &&
    arrStation.trim() !== "" &&
    trainGrade.trim() !== "" &&
    trainNo.trim() !== "";

  const handleSave = () => {
    if (!depDate || !arrDate) return;
    onSubmit({
      kind: "train",
      dep_date: depDate,
      arr_date: arrDate,
      start_time: toApiTime(startTime),
      end_time: toApiTime(endTime),
      dep_station: depStation.trim(),
      arr_station: arrStation.trim(),
      train_grade: trainGrade.trim(),
      train_no: trainNo.trim(),
      ...(carNo.trim() ? { car_no: carNo.trim() } : {}),
      ...(seatNo.trim() ? { seat_no: seatNo.trim() } : {}),
      ...(memo.trim() ? { memo: memo.trim() } : {}),
    });
  };

  return (
    <ModalShell
      visible
      leading="back"
      title="티켓 정보 추가하기"
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      canSave={canSave}
    >
      <Field
        label="출발역"
        required
        value={depStation}
        onChangeText={setDepStation}
        placeholder="서울"
      />
      <Field
        label="도착역"
        required
        value={arrStation}
        onChangeText={setArrStation}
        placeholder="부산"
      />
      <ChipSelect
        label="출발일"
        required
        options={dateOptions}
        selected={depDate}
        onSelect={setDepDate}
      />
      <TimeField
        label="출발시간"
        required
        value={startTime}
        onChangeText={setStartTime}
      />
      <ChipSelect
        label="도착일"
        required
        options={dateOptions}
        selected={arrDate}
        onSelect={setArrDate}
      />
      <TimeField
        label="도착시간"
        required
        value={endTime}
        onChangeText={setEndTime}
      />
      <Field
        label="열차 등급"
        required
        value={trainGrade}
        onChangeText={setTrainGrade}
        placeholder="KTX, ITX-새마을 등"
      />
      <Field
        label="열차번호"
        required
        value={trainNo}
        onChangeText={setTrainNo}
        placeholder="101"
      />
      <Field
        label="호차(선택)"
        value={carNo}
        onChangeText={setCarNo}
        placeholder="7"
      />
      <Field
        label="좌석(선택)"
        value={seatNo}
        onChangeText={setSeatNo}
        placeholder="3A"
      />
      <Field
        label="메모(선택)"
        value={memo}
        onChangeText={setMemo}
        placeholder="메모를 입력하세요"
        multiline
      />
    </ModalShell>
  );
}
