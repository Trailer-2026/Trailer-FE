import Feather from "@expo/vector-icons/Feather";
import { useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { addMonths, isSameDay, startOfDay } from "@/src/features/course/date";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const COL = `${100 / 7}%`;

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

type Props = {
  visible: boolean;
  title: string;
  selected: Date | null;
  minDate: Date;
  maxDate: Date;
  onClose: () => void;
  onSelect: (d: Date) => void;
};

export function DatePickerModal({
  visible,
  title,
  selected,
  minDate,
  maxDate,
  onClose,
  onSelect,
}: Props) {
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(() => firstOfMonth(selected ?? minDate));

  // 열릴 때 표시 월을 선택값(없으면 최소일) 기준으로 초기화
  useEffect(() => {
    if (visible) setMonth(firstOfMonth(selected ?? minDate));
    // selected/minDate 는 매 렌더 새 객체라 deps 에서 제외 (열림 시점에만 초기화)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const min = startOfDay(minDate);
  const max = startOfDay(maxDate);

  const canPrev =
    month.getFullYear() > min.getFullYear() ||
    (month.getFullYear() === min.getFullYear() &&
      month.getMonth() > min.getMonth());
  const canNext =
    month.getFullYear() < max.getFullYear() ||
    (month.getFullYear() === max.getFullYear() &&
      month.getMonth() < max.getMonth());

  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < month.getDay(); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          onPress={() => {}}
          className="bg-white"
          style={{
            borderTopLeftRadius: scale(24),
            borderTopRightRadius: scale(24),
            paddingHorizontal: scale(20),
            paddingTop: verticalScale(16),
            paddingBottom: insets.bottom + verticalScale(20),
          }}
        >
          {/* 헤더 */}
          <View
            className="flex-row items-center justify-between"
            style={{ marginBottom: verticalScale(14) }}
          >
            <Text
              className="font-bold text-gray-900"
              style={{ fontSize: moderateScale(16) }}
            >
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={moderateScale(22)} color="#111827" />
            </Pressable>
          </View>

          {/* 월 이동 */}
          <View
            className="flex-row items-center justify-between"
            style={{ marginBottom: verticalScale(10) }}
          >
            <Pressable
              disabled={!canPrev}
              onPress={() => setMonth(addMonths(month, -1))}
              hitSlop={10}
              style={{ opacity: canPrev ? 1 : 0.25 }}
            >
              <Feather name="chevron-left" size={moderateScale(22)} color="#111827" />
            </Pressable>
            <Text
              className="font-semibold text-gray-900"
              style={{ fontSize: moderateScale(15) }}
            >
              {month.getFullYear()}년 {month.getMonth() + 1}월
            </Text>
            <Pressable
              disabled={!canNext}
              onPress={() => setMonth(addMonths(month, 1))}
              hitSlop={10}
              style={{ opacity: canNext ? 1 : 0.25 }}
            >
              <Feather
                name="chevron-right"
                size={moderateScale(22)}
                color="#111827"
              />
            </Pressable>
          </View>

          {/* 요일 */}
          <View className="flex-row" style={{ marginBottom: verticalScale(4) }}>
            {WEEKDAYS.map((w, i) => (
              <View key={w} style={{ width: COL, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: moderateScale(12),
                    color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : "#9CA3AF",
                  }}
                >
                  {w}
                </Text>
              </View>
            ))}
          </View>

          {/* 날짜 그리드 */}
          {rows.map((row, ri) => (
            <View key={ri} className="flex-row">
              {row.map((cell, ci) => {
                if (!cell)
                  return (
                    <View
                      key={ci}
                      style={{ width: COL, height: verticalScale(44) }}
                    />
                  );
                const disabled = cell < min || cell > max;
                const isSel = selected ? isSameDay(cell, selected) : false;
                return (
                  <View
                    key={ci}
                    style={{
                      width: COL,
                      height: verticalScale(44),
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Pressable
                      disabled={disabled}
                      onPress={() => {
                        onSelect(cell);
                        onClose();
                      }}
                      style={{
                        width: scale(36),
                        height: scale(36),
                        borderRadius: scale(18),
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isSel ? "#81E4D0" : "transparent",
                      }}
                    >
                      <Text
                        className={isSel ? "font-bold" : ""}
                        style={{
                          fontSize: moderateScale(14),
                          color: disabled
                            ? "#D1D5DB"
                            : isSel
                              ? "#0F766E"
                              : "#111827",
                        }}
                      >
                        {cell.getDate()}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
