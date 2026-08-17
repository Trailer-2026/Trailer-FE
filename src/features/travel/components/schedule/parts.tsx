import Feather from "@expo/vector-icons/Feather";
import { createContext, ReactNode, useContext, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { StationPickerSheet } from "@/src/features/course/components/StationPickerModal";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import TimeWheelSheet from "./TimeWheelSheet";

export const ACCENT = "#5E84F4";
const BORDER = "#E5E7EB";

/* ------------------------------------------------------------------ */
/* 시각 선택 시트 연결                                                   */
/* ------------------------------------------------------------------ */

type TimePickerRequest = {
  label: string;
  value: string;
  onConfirm: (hhmm: string) => void;
};

/**
 * TimeField 가 시트를 직접 렌더하지 않고 ModalShell 에 요청만 올린다.
 *
 * 시트는 화면 전체를 덮어야 하는데, TimeField 는 폼 ScrollView 안에 있어서
 * 거기서 절대배치하면 스크롤 영역에 갇히고 잘린다. 중첩 Modal 로 띄우는 방법은
 * 안드로이드에서 안쪽 ScrollView 가 터치를 못 받아 휠이 굴러가지 않는다.
 * → ModalShell 이 자기 최상위에서 하나만 렌더하도록 요청을 끌어올린다.
 */
const TimePickerContext = createContext<(req: TimePickerRequest) => void>(
  () => {},
);

/* ------------------------------------------------------------------ */
/* 역 선택 시트 연결                                                     */
/* ------------------------------------------------------------------ */

type StationPickerRequest = {
  value: string;
  /** 반대편(출발/도착)에서 이미 고른 역 — 목록에서 숨긴다. */
  excludeName?: string;
  onConfirm: (stationName: string) => void;
};

/** 시각 시트와 같은 이유로 요청을 ModalShell 최상위까지 끌어올린다. */
const StationPickerContext = createContext<(req: StationPickerRequest) => void>(
  () => {},
);

/* ------------------------------------------------------------------ */
/* 시각("HH:MM") 입력 도우미                                            */
/* ------------------------------------------------------------------ */

/** "HH:MM" 유효성(00:00~23:59). */
export function isValidTime(hhmm: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm);
}

/** "HH:MM" → API 형식 "HH:MM:SS". */
export function toApiTime(hhmm: string): string {
  return `${hhmm}:00`;
}

/* ------------------------------------------------------------------ */
/* 모달 골격 — 헤더(닫기/제목/저장) + 스크롤 폼                          */
/* ------------------------------------------------------------------ */
export function ModalShell({
  visible,
  onClose,
  title,
  onSave,
  saving,
  canSave,
  saveLabel = "저장",
  leading = "close",
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  onSave: () => void;
  saving: boolean;
  canSave: boolean;
  saveLabel?: string;
  /** "close": ✕ + 가운데 제목 / "back": 앱 공통 뒤로 아이콘 + 그 옆 제목 */
  leading?: "close" | "back";
  children: ReactNode;
}) {
  const saveEnabled = canSave && !saving;
  const back = leading === "back";
  // 폼 안의 TimeField 들이 공유하는 단 하나의 시각 선택 시트.
  const [timeRequest, setTimeRequest] = useState<TimePickerRequest | null>(
    null,
  );
  // StationField 들이 공유하는 단 하나의 역 선택 시트.
  const [stationRequest, setStationRequest] =
    useState<StationPickerRequest | null>(null);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
        {/* 헤더 */}
        <View
          className="flex-row items-center justify-between"
          style={{
            paddingHorizontal: scale(20),
            // 뒤로 헤더는 탭 상단바와 같은 위치에 오도록 앱 공통 기하를 쓴다.
            ...(back
              ? headerBarStyle()
              : {
                  paddingTop: verticalScale(12),
                  paddingBottom: verticalScale(12),
                }),
            borderBottomWidth: 1,
            borderBottomColor: BORDER,
          }}
        >
          {back ? (
            <View className="flex-row items-center">
              <Pressable
                onPress={onClose}
                hitSlop={12}
                className="active:opacity-60"
                style={{ padding: scale(4) }}
                accessibilityRole="button"
                accessibilityLabel="뒤로"
              >
                <BackIcon
                  width={moderateScale(12)}
                  height={moderateScale(17)}
                />
              </Pressable>
              <Text
                className="text-gray-900"
                style={{
                  fontSize: moderateScale(17),
                  marginLeft: scale(8),
                  fontWeight: 650 as never,
                }}
              >
                {title}
              </Text>
            </View>
          ) : (
            <>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                className="active:opacity-60"
              >
                <Text
                  className="text-gray-500"
                  style={{ fontSize: moderateScale(20) }}
                >
                  ✕
                </Text>
              </Pressable>
              <Text
                className="font-bold text-gray-900"
                style={{ fontSize: moderateScale(16) }}
              >
                {title}
              </Text>
            </>
          )}
          <Pressable
            onPress={onSave}
            disabled={!saveEnabled}
            hitSlop={10}
            className="active:opacity-60"
          >
            <Text
              className="font-bold"
              style={{
                fontSize: moderateScale(15),
                color: saveEnabled ? ACCENT : "#C4C9D4",
              }}
            >
              {saving ? "저장 중…" : saveLabel}
            </Text>
          </Pressable>
        </View>

        {/*
          RN Modal 은 액티비티와 별개의 윈도우라 매니페스트의 adjustResize 가 먹지 않는다.
          → 모달 안에서는 키보드가 떠도 화면이 줄지 않아 하단 입력칸이 가려진다.
          behavior="height" 로 KAV 가 직접 높이를 줄여주면 스크롤 영역이 좁아지고,
          안드로이드 네이티브 ScrollView 가 포커스된 입력칸을 알아서 위로 스크롤한다.
        */}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: scale(20),
              paddingBottom: verticalScale(40),
            }}
          >
            <TimePickerContext.Provider value={setTimeRequest}>
              <StationPickerContext.Provider value={setStationRequest}>
                {children}
              </StationPickerContext.Provider>
            </TimePickerContext.Provider>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/*
        시각 선택 시트 — 폼 ScrollView 밖, 화면 전체를 덮는 오버레이.
        SafeAreaView **바깥**에 두는 이유: 절대배치 자식은 부모의 paddingBottom 위로
        올라오지 않아 시트가 내비게이션 바 밑까지 깔린다. 하단 여백은 시트가 자기
        insets 로 직접 잡는다(여백을 잡는 주체를 한 곳으로).
      */}
      {timeRequest ? (
        <TimeWheelSheet
          label={timeRequest.label}
          value={timeRequest.value}
          onClose={() => setTimeRequest(null)}
          onConfirm={(v) => {
            timeRequest.onConfirm(v);
            setTimeRequest(null);
          }}
        />
      ) : null}

      {/* 역 선택 시트 — 시각 시트와 같은 이유로 여기(폼 ScrollView 밖)에서 렌더. */}
      {stationRequest ? (
        <StationPickerSheet
          selectedName={stationRequest.value || null}
          excludeName={stationRequest.excludeName ?? null}
          onClose={() => setStationRequest(null)}
          onSelect={(s) => stationRequest.onConfirm(s.station_name)}
        />
      ) : null}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* 라벨 + 텍스트 입력                                                   */
/* ------------------------------------------------------------------ */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  multiline,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
  autoCapitalize?: "none" | "characters";
}) {
  return (
    <View style={{ marginBottom: verticalScale(16) }}>
      <FieldLabel label={label} required={required} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          borderWidth: 1,
          borderColor: BORDER,
          borderRadius: scale(10),
          paddingHorizontal: scale(14),
          paddingVertical: verticalScale(12),
          fontSize: moderateScale(14),
          color: "#111827",
          minHeight: multiline ? verticalScale(72) : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

/** "HH:MM"(24시) → "09시 30분". 값이 없거나 이상하면 빈 문자열. */
export function formatKoreanTime(hhmm: string): string {
  if (!isValidTime(hhmm)) return "";
  const [h, m] = hhmm.split(":");
  return `${h}시 ${m}분`;
}

/**
 * 시각 선택 — 누르면 하단에서 시(0~23)·분 휠 시트가 올라온다.
 * 외부로 오가는 값은 그대로 "HH:MM"(24시)이라 isValidTime/toApiTime 을 그대로 쓴다.
 */
export function TimeField({
  label,
  value,
  onChangeText,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  required?: boolean;
}) {
  const openTimePicker = useContext(TimePickerContext);
  const display = formatKoreanTime(value);

  return (
    <View style={{ marginBottom: verticalScale(16) }}>
      <FieldLabel label={label} required={required} />
      <Pressable
        onPress={() =>
          openTimePicker({ label, value, onConfirm: onChangeText })
        }
        className="flex-row items-center justify-between active:opacity-70"
        style={{
          borderWidth: 1,
          borderColor: BORDER,
          borderRadius: scale(10),
          paddingHorizontal: scale(14),
          paddingVertical: verticalScale(12),
        }}
        accessibilityRole="button"
        accessibilityLabel={`${label} 선택`}
      >
        <Text
          style={{
            fontSize: moderateScale(14),
            color: display ? "#111827" : "#9CA3AF",
          }}
        >
          {display || "시각을 선택하세요"}
        </Text>
        <Feather name="clock" size={moderateScale(16)} color="#9CA3AF" />
      </Pressable>
    </View>
  );
}

/**
 * 역 선택 — 누르면 코스 추천에서 쓰는 역 목록 시트가 그대로 올라온다.
 * 값은 역명 문자열이라 서버로 보내는 dep_station/arr_station 을 그대로 쓴다.
 */
export function StationField({
  label,
  value,
  onChangeText,
  required,
  excludeName,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  required?: boolean;
  excludeName?: string;
}) {
  const openStationPicker = useContext(StationPickerContext);

  return (
    <View style={{ marginBottom: verticalScale(16) }}>
      <FieldLabel label={label} required={required} />
      <Pressable
        onPress={() =>
          openStationPicker({ value, excludeName, onConfirm: onChangeText })
        }
        className="flex-row items-center justify-between active:opacity-70"
        style={{
          borderWidth: 1,
          borderColor: BORDER,
          borderRadius: scale(10),
          paddingHorizontal: scale(14),
          paddingVertical: verticalScale(12),
        }}
        accessibilityRole="button"
        accessibilityLabel={`${label} 선택`}
      >
        <Text
          style={{
            fontSize: moderateScale(14),
            color: value ? "#111827" : "#9CA3AF",
          }}
        >
          {value || "역을 선택하세요"}
        </Text>
        <Feather name="chevron-down" size={moderateScale(16)} color="#9CA3AF" />
      </Pressable>
    </View>
  );
}

export function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <Text
      className="text-gray-700"
      style={{
        fontSize: moderateScale(13),
        marginBottom: verticalScale(6),
        fontWeight: 650 as never,
      }}
    >
      {required ? <Text style={{ color: "#EF4444" }}>* </Text> : null}
      {label}
    </Text>
  );
}

/* ------------------------------------------------------------------ */
/* 단일 선택 칩 그룹 (day/date 선택)                                     */
/* ------------------------------------------------------------------ */
export function ChipSelect<T extends string | number>({
  label,
  required,
  options,
  selected,
  onSelect,
}: {
  label: string;
  required?: boolean;
  options: { value: T; label: string }[];
  selected: T | null;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={{ marginBottom: verticalScale(16) }}>
      <FieldLabel label={label} required={required} />
      <View className="flex-row flex-wrap" style={{ gap: scale(8) }}>
        {options.map((opt) => {
          const active = opt.value === selected;
          return (
            <Pressable
              key={String(opt.value)}
              onPress={() => onSelect(opt.value)}
              className="active:opacity-70"
              style={{
                paddingHorizontal: scale(14),
                paddingVertical: verticalScale(9),
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? ACCENT : BORDER,
                backgroundColor: active ? "#EEF2FF" : "#FFFFFF",
              }}
            >
              <Text
                className={active ? "font-semibold" : "font-medium"}
                style={{
                  fontSize: moderateScale(13),
                  color: active ? ACCENT : "#6B7280",
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
