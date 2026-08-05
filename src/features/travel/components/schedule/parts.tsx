import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

export const ACCENT = "#5E84F4";
const BORDER = "#E5E7EB";

/* ------------------------------------------------------------------ */
/* 시각("HH:MM") 입력 도우미                                            */
/* ------------------------------------------------------------------ */

/** 입력값을 숫자만 남겨 "HH:MM" 형태로 정규화(0930 → 09:30). */
export function normalizeTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

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
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
        {/* 헤더 */}
        <View
          className="flex-row items-center justify-between"
          style={{
            paddingHorizontal: scale(20),
            // 뒤로 헤더는 앱 공통 화면(약관·프로필 등)과 같은 위 여백을 준다.
            paddingTop: verticalScale(back ? 16 : 12),
            paddingBottom: verticalScale(back ? 10 : 12),
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
                className="font-bold text-gray-900"
                style={{ fontSize: moderateScale(17), marginLeft: scale(8) }}
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

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: scale(20),
              paddingBottom: verticalScale(40),
            }}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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

/** 시각 입력 — "HH:MM" 자동 포맷. */
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
  return (
    <Field
      label={label}
      value={value}
      onChangeText={(v) => onChangeText(normalizeTimeInput(v))}
      placeholder="09:30"
      keyboardType="numeric"
      required={required}
    />
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
      className="font-semibold text-gray-700"
      style={{ fontSize: moderateScale(13), marginBottom: verticalScale(6) }}
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
