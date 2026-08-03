import { useState } from "react";
import { Alert, View } from "react-native";

import { Text } from "@/src/components/Text";
import type { PlaceSearchResult } from "@/src/features/place/types";
import { describeScheduleError } from "@/src/features/travel/errors";
import { useUpdateSchedule } from "@/src/features/travel/queries";
import type {
  ScheduleUpdateRequest,
  TravelScheduleItem,
} from "@/src/features/travel/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { formatClockTime } from "../../format";
import {
  Field,
  FieldLabel,
  ModalShell,
  TimeField,
  isValidTime,
  toApiTime,
} from "./parts";
import PlaceSearchField from "./PlaceSearchField";

/**
 * 일정 항목 편집. 현재 값으로 프리필하고 **변경된 필드만** PATCH 로 보낸다.
 * day_no·kind 는 변경 불가라 읽기전용으로 표시한다.
 */
export default function EditScheduleModal({
  visible,
  onClose,
  travelIdx,
  item,
  dayNo,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  travelIdx: number;
  item: TravelScheduleItem;
  dayNo: number;
  onSaved?: () => void;
}) {
  const isTrain = item.kind === "train";
  const update = useUpdateSchedule(travelIdx);

  const [title, setTitle] = useState(item.title);
  const [startTime, setStartTime] = useState(formatClockTime(item.start_time));
  const [endTime, setEndTime] = useState(formatClockTime(item.end_time));
  const [memo, setMemo] = useState(item.memo ?? "");
  const [imageUrl, setImageUrl] = useState(item.image_url ?? "");
  // 열차 필드
  const [trainNo, setTrainNo] = useState(item.train_no ?? "");
  const [trainGrade, setTrainGrade] = useState(item.train_grade ?? "");
  const [depStation, setDepStation] = useState(item.dep_station ?? "");
  const [arrStation, setArrStation] = useState(item.arr_station ?? "");
  const [carNo, setCarNo] = useState(item.car_no ?? "");
  const [seatNo, setSeatNo] = useState(item.seat_no ?? "");
  // 장소 재검색으로 갱신되는 좌표(없으면 기존 유지)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  // 변경된 필드만 담는다.
  const buildBody = (): ScheduleUpdateRequest => {
    const body: ScheduleUpdateRequest = {};

    // 필수 텍스트: 비었으면 건드리지 않음, 값이 바뀐 경우만
    if (title.trim() && title.trim() !== item.title) body.title = title.trim();

    // 시각: 유효하고 원본과 다를 때만
    if (isValidTime(startTime) && toApiTime(startTime) !== item.start_time) {
      body.start_time = toApiTime(startTime);
    }
    if (isValidTime(endTime) && toApiTime(endTime) !== item.end_time) {
      body.end_time = toApiTime(endTime);
    }

    // 메모: 빈 값으로도 바꿀 수 있음(비교만 다르면 전송)
    if (memo.trim() !== (item.memo ?? "")) body.memo = memo.trim();

    if (isTrain) {
      if (trainGrade.trim() && trainGrade.trim() !== (item.train_grade ?? ""))
        body.train_grade = trainGrade.trim();
      if (trainNo.trim() && trainNo.trim() !== (item.train_no ?? ""))
        body.train_no = trainNo.trim();
      if (depStation.trim() && depStation.trim() !== (item.dep_station ?? ""))
        body.dep_station = depStation.trim();
      if (arrStation.trim() && arrStation.trim() !== (item.arr_station ?? ""))
        body.arr_station = arrStation.trim();
      // 호차·좌석은 빈 값으로 지울 수 있음
      if (carNo.trim() !== (item.car_no ?? "")) body.car_no = carNo.trim();
      if (seatNo.trim() !== (item.seat_no ?? "")) body.seat_no = seatNo.trim();
    } else {
      if (imageUrl.trim() !== (item.image_url ?? ""))
        body.image_url = imageUrl.trim();
      // 장소 재검색으로 좌표가 바뀐 경우만
      if (coords) {
        if (coords.lat !== item.latitude) body.latitude = coords.lat;
        if (coords.lng !== item.longitude) body.longitude = coords.lng;
      }
    }

    return body;
  };

  const body = buildBody();
  const hasChanges = Object.keys(body).length > 0;

  const handleSave = () => {
    if (!hasChanges) return;
    update.mutate(
      { scheduleIdx: item.schedule_idx, body },
      {
        onSuccess: () => {
          onSaved?.();
          onClose();
        },
        onError: (e) => Alert.alert("수정 실패", describeScheduleError(e)),
      },
    );
  };

  const onPickPlace = (place: PlaceSearchResult | null) => {
    if (!place) return;
    setTitle(place.name);
    setCoords({ lat: place.latitude, lng: place.longitude });
  };

  return (
    <ModalShell
      visible={visible}
      title="일정 편집"
      onClose={onClose}
      onSave={handleSave}
      saving={update.isPending}
      canSave={hasChanges}
    >
      {/* 변경 불가: 종류 · 날짜 */}
      <ReadonlyRow label="종류" value={isTrain ? "티켓" : "장소"} />
      <ReadonlyRow label="날짜" value={`Day ${dayNo}`} />

      {!isTrain ? (
        <>
          <Field label="제목" required value={title} onChangeText={setTitle} />
          <PlaceSearchField
            selected={null}
            onSelect={onPickPlace}
            label="장소 변경(선택)"
            required={false}
          />
          <TimeField
            label="방문 시각"
            value={startTime}
            onChangeText={setStartTime}
          />
          <TimeField
            label="종료 시각"
            value={endTime}
            onChangeText={setEndTime}
          />
          <Field
            label="이미지 URL(선택)"
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://…"
          />
        </>
      ) : (
        <>
          <Field
            label="열차 등급"
            required
            value={trainGrade}
            onChangeText={setTrainGrade}
          />
          <Field
            label="열차 번호"
            required
            value={trainNo}
            onChangeText={setTrainNo}
          />
          <Field
            label="출발역"
            required
            value={depStation}
            onChangeText={setDepStation}
          />
          <Field
            label="도착역"
            required
            value={arrStation}
            onChangeText={setArrStation}
          />
          <TimeField
            label="출발 시각"
            value={startTime}
            onChangeText={setStartTime}
          />
          <TimeField
            label="도착 시각"
            value={endTime}
            onChangeText={setEndTime}
          />
          <Field label="호차(선택)" value={carNo} onChangeText={setCarNo} />
          <Field label="좌석(선택)" value={seatNo} onChangeText={setSeatNo} />
        </>
      )}

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

/** 변경 불가 필드 표시(비활성). */
function ReadonlyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: verticalScale(16) }}>
      <FieldLabel label={label} />
      <View
        style={{
          borderWidth: 1,
          borderColor: "#E5E7EB",
          borderRadius: scale(10),
          paddingHorizontal: scale(14),
          paddingVertical: verticalScale(12),
          backgroundColor: "#F5F5F7",
        }}
      >
        <Text className="text-gray-400" style={{ fontSize: moderateScale(14) }}>
          {value}
        </Text>
      </View>
    </View>
  );
}
