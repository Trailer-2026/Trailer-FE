import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { PrimaryButton } from "@/src/features/course/components/PrimaryButton";
import { addDays, isSameDay, startOfDay, toIsoDate } from "@/src/features/course/date";
import { describeScheduleError } from "@/src/features/travel/errors";
import { useCreateManualTravel } from "@/src/features/travel/queries";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";
const TEAL = "#B0E6DB";
const BORDER = "#E5E7EB";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const DATE_RANGE = 30; // 오늘부터 한 달 이내만 출발일로 고를 수 있다

// 숙박 수(nights) → 라벨. 종료일 = 출발일 + nights.
const DURATIONS: { nights: number; label: string }[] = [
  { nights: 0, label: "당일치기" },
  { nights: 1, label: "1박 2일" },
  { nights: 2, label: "2박 3일" },
  { nights: 3, label: "3박 4일" },
  { nights: 4, label: "4박 5일" },
  { nights: 5, label: "5박 6일" },
];

/**
 * 직접 일정 만들기 — 빈 여행 1건을 만든다(POST /api/travels/manual).
 * 일정 항목은 생성 직후 이동하는 일정표 상세에서 하나씩 추가한다.
 * 예정 여행은 1개만 가질 수 있어, 이미 있으면 서버가 400 으로 막는다.
 */
export default function ManualTravelScreen() {
  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("");
  const [nights, setNights] = useState<number | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);
  const dates = useMemo(
    () => Array.from({ length: DATE_RANGE }, (_, i) => addDays(today, i)),
    [today],
  );
  const [departDate, setDepartDate] = useState<Date>(today);

  const create = useCreateManualTravel();
  const canSave = nights !== null && !create.isPending;

  const handleSave = () => {
    if (nights === null) return;
    create.mutate(
      {
        start_date: toIsoDate(departDate),
        end_date: toIsoDate(addDays(departDate, nights)),
        // 비우면 서버가 지역·기간으로 제목을 자동 생성한다.
        ...(title.trim() ? { title: title.trim() } : {}),
        ...(region.trim() ? { region: region.trim() } : {}),
      },
      {
        // 만든 여행의 일정표로 바로 이동(뒤로 누르면 일정 탭). 여기서 항목을 채운다.
        onSuccess: (travel) =>
          router.replace({
            pathname: "/travel/[travelIdx]",
            params: { travelIdx: travel.travel_idx, cover: "" },
          }),
        onError: (e) => Alert.alert("생성 실패", describeScheduleError(e)),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      {/* 헤더 — 앱 공통(뒤로 + 제목) */}
      <View
        className="flex-row items-center"
        style={{
          paddingTop: verticalScale(16),
          paddingHorizontal: scale(20),
          paddingBottom: verticalScale(10),
        }}
      >
        <Pressable
          onPress={() => router.back()}
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
          직접 일정 만들기
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: scale(20),
          paddingBottom: verticalScale(24),
        }}
      >
        {/* 출발 날짜 */}
        <SectionLabel required style={{ marginTop: verticalScale(12) }}>
          출발 날짜
        </SectionLabel>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: scale(10),
            paddingVertical: verticalScale(4),
          }}
          // 가로 ScrollView 가 세로로 부풀지 않도록 콘텐츠 높이로 고정.
          style={{ height: verticalScale(74), flexGrow: 0 }}
        >
          {dates.map((d) => {
            const selected = isSameDay(d, departDate);
            return (
              <Pressable
                key={d.getTime()}
                onPress={() => setDepartDate(d)}
                className="items-center"
                style={{ width: scale(46) }}
              >
                <Text
                  className="font-semibold"
                  style={{
                    fontSize: moderateScale(12),
                    color: selected ? "#111827" : "#9CA3AF",
                    marginBottom: verticalScale(6),
                  }}
                >
                  {WEEKDAYS[d.getDay()]}
                </Text>
                <View
                  className="items-center justify-center"
                  style={{
                    width: scale(40),
                    height: scale(40),
                    borderRadius: 999,
                    // Android: 배경색이 바뀔 때 borderRadius 가 재적용되지 않아
                    // 사각형으로 보이는 문제 → overflow 로 강제 클립.
                    overflow: "hidden",
                    backgroundColor: selected ? TEAL : "transparent",
                  }}
                >
                  <Text
                    className="font-semibold"
                    style={{
                      fontSize: moderateScale(15),
                      color: selected ? "#111827" : "#6B7280",
                    }}
                  >
                    {d.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 여행 기간 */}
        <SectionLabel required style={{ marginTop: verticalScale(20) }}>
          여행 기간
        </SectionLabel>
        <View className="flex-row flex-wrap" style={{ gap: scale(8) }}>
          {DURATIONS.map((d) => {
            const selected = nights === d.nights;
            return (
              <Pressable
                key={d.nights}
                onPress={() => setNights(d.nights)}
                className="active:opacity-70"
                style={{
                  paddingHorizontal: scale(16),
                  paddingVertical: verticalScale(10),
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? ACCENT : BORDER,
                  backgroundColor: selected ? "#EEF2FF" : "#FFFFFF",
                }}
              >
                <Text
                  className={selected ? "font-semibold" : "font-medium"}
                  style={{
                    fontSize: moderateScale(13),
                    color: selected ? ACCENT : "#6B7280",
                  }}
                >
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 선택 입력 */}
        <SectionLabel style={{ marginTop: verticalScale(24) }}>
          여행 제목(선택)
        </SectionLabel>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="비워두면 지역·기간으로 자동 생성돼요"
          placeholderTextColor="#9CA3AF"
          style={inputStyle}
        />

        <SectionLabel style={{ marginTop: verticalScale(18) }}>
          대표 지역(선택)
        </SectionLabel>
        <TextInput
          value={region}
          onChangeText={setRegion}
          placeholder="부산"
          placeholderTextColor="#9CA3AF"
          style={inputStyle}
        />

        <Text
          className="text-gray-400"
          style={{
            fontSize: moderateScale(12),
            marginTop: verticalScale(16),
            lineHeight: moderateScale(18),
          }}
        >
          빈 여행이 먼저 만들어져요. 장소·티켓 같은 일정 항목은 만든 뒤 일정표에서
          하나씩 추가할 수 있어요.
        </Text>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: scale(20),
          paddingBottom: verticalScale(12),
        }}
      >
        <PrimaryButton
          label={create.isPending ? "만드는 중…" : "일정 만들기"}
          onPress={handleSave}
          disabled={!canSave}
        />
      </View>
    </SafeAreaView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: BORDER,
  borderRadius: scale(10),
  paddingHorizontal: scale(14),
  paddingVertical: verticalScale(12),
  fontSize: moderateScale(14),
  color: "#111827",
} as const;

function SectionLabel({
  children,
  required,
  style,
}: {
  children: React.ReactNode;
  required?: boolean;
  style?: object;
}) {
  return (
    <Text
      className="font-semibold text-gray-700"
      style={{
        fontSize: moderateScale(13),
        marginBottom: verticalScale(8),
        ...style,
      }}
    >
      {required ? <Text style={{ color: "#EF4444" }}>* </Text> : null}
      {children}
    </Text>
  );
}
