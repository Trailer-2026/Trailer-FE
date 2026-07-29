import Feather from "@expo/vector-icons/Feather";
import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, View } from "react-native";

import { Text } from "@/src/components/Text";
import type { PlaceSearchResult } from "@/src/features/place/types";
import { describeScheduleError } from "@/src/features/travel/errors";
import { useCreateSchedule } from "@/src/features/travel/queries";
import type {
  ScheduleCreateRequest,
  TravelDay,
} from "@/src/features/travel/types";
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

type Step = "choose" | "visit" | "train";

/**
 * 일정 항목 추가 — 종류 선택(장소/티켓) 후 각 폼.
 * 장소는 검색으로 좌표를 채우고, 티켓은 출발/도착일·시각·열차 정보를 입력한다.
 */
export default function AddScheduleModal({
  visible,
  onClose,
  travelIdx,
  days,
  initialDayNo,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  travelIdx: number;
  days: TravelDay[];
  initialDayNo?: number;
  onSaved?: () => void;
}) {
  const [step, setStep] = useState<Step>("choose");
  const create = useCreateSchedule(travelIdx);

  useEffect(() => {
    if (visible) setStep("choose");
  }, [visible]);

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

  if (step === "choose") {
    return <ChooseSheet onClose={onClose} onPick={setStep} />;
  }
  if (step === "visit") {
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

/* ------------------------------------------------------------------ */
/* 종류 선택 시트                                                       */
/* ------------------------------------------------------------------ */
function ChooseSheet({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (step: Step) => void;
}) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        <Pressable
          className="bg-white"
          style={{
            borderTopLeftRadius: scale(20),
            borderTopRightRadius: scale(20),
            paddingHorizontal: scale(20),
            paddingTop: verticalScale(20),
            paddingBottom: verticalScale(36),
            gap: verticalScale(12),
          }}
        >
          <Text
            className="font-bold text-gray-900"
            style={{ fontSize: moderateScale(17), marginBottom: verticalScale(4) }}
          >
            어떤 일정을 추가할까요?
          </Text>
          <ChoiceRow
            icon="map-pin"
            title="장소"
            desc="관광지·맛집 등 방문 일정"
            onPress={() => onPick("visit")}
          />
          <ChoiceRow
            icon="navigation"
            title="티켓"
            desc="기차 승차권 정보"
            onPress={() => onPick("train")}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ChoiceRow({
  icon,
  title,
  desc,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center active:opacity-70"
      style={{
        backgroundColor: "#F5F5F7",
        borderRadius: scale(14),
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(16),
        gap: scale(14),
      }}
    >
      <View
        className="items-center justify-center rounded-full"
        style={{ width: scale(40), height: scale(40), backgroundColor: "#EEF2FF" }}
      >
        <Feather name={icon} size={moderateScale(18)} color={ACCENT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(15) }}
        >
          {title}
        </Text>
        <Text
          className="text-gray-400"
          style={{ fontSize: moderateScale(12), marginTop: verticalScale(2) }}
        >
          {desc}
        </Text>
      </View>
      <Feather name="chevron-right" size={moderateScale(20)} color="#C4C9D4" />
    </Pressable>
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
  days: TravelDay[];
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
  days: TravelDay[];
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

  const canSave =
    !!depDate &&
    !!arrDate &&
    isValidTime(startTime) &&
    isValidTime(endTime) &&
    trainNo.trim() !== "" &&
    trainGrade.trim() !== "" &&
    depStation.trim() !== "" &&
    arrStation.trim() !== "";

  const handleSave = () => {
    if (!depDate || !arrDate) return;
    onSubmit({
      kind: "train",
      dep_date: depDate,
      arr_date: arrDate,
      start_time: toApiTime(startTime),
      end_time: toApiTime(endTime),
      train_no: trainNo.trim(),
      train_grade: trainGrade.trim(),
      dep_station: depStation.trim(),
      arr_station: arrStation.trim(),
      ...(carNo.trim() ? { car_no: carNo.trim() } : {}),
      ...(seatNo.trim() ? { seat_no: seatNo.trim() } : {}),
      ...(memo.trim() ? { memo: memo.trim() } : {}),
    });
  };

  return (
    <ModalShell
      visible
      title="티켓 추가"
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      canSave={canSave}
    >
      <ChipSelect
        label="출발일"
        required
        options={dateOptions}
        selected={depDate}
        onSelect={setDepDate}
      />
      <ChipSelect
        label="도착일"
        required
        options={dateOptions}
        selected={arrDate}
        onSelect={setArrDate}
      />
      <TimeField
        label="출발 시각"
        required
        value={startTime}
        onChangeText={setStartTime}
      />
      <TimeField
        label="도착 시각"
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
        label="열차 번호"
        required
        value={trainNo}
        onChangeText={setTrainNo}
        placeholder="101"
      />
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
