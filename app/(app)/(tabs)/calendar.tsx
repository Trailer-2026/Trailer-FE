import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ImageBackground, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import type { Ticket, Trip, TripDay } from "@/src/features/schedule/data";
import { useScheduleStore } from "@/src/features/schedule/store";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const BLUE = "#3C5DBE";
const DOT = "#5E84F4";
const MINT = "#81E4D0";
const DARK_BG = "#383838";
const LAVENDER = "#EEF1FB";

type Tab = "ticket" | "schedule";

export default function CalendarTab() {
  const trip = useScheduleStore((s) => s.trip);
  const initialTab = useScheduleStore((s) => s.initialTab);

  const [tab, setTab] = useState<Tab>(initialTab);

  // 일정이 새로 추가되면 기본 서브탭으로 이동
  useEffect(() => {
    if (trip) setTab(initialTab);
  }, [trip, initialTab]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* 헤더 */}
      <View
        className="flex-row items-center bg-white"
        style={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(6),
          paddingBottom: verticalScale(8),
          gap: scale(10),
        }}
      >
        <Pressable onPress={() => router.navigate("/")} hitSlop={12}>
          <BackIcon
            color="#111827"
            width={moderateScale(14)}
            height={moderateScale(20)}
          />
        </Pressable>
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(20) }}
        >
          내 일정
        </Text>
      </View>

      {/* 서브탭 */}
      <View className="flex-row bg-white">
        {(
          [
            { key: "ticket", label: "승차권" },
            { key: "schedule", label: "일정표" },
          ] as const
        ).map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              className="items-center"
              style={{ flex: 1, paddingVertical: verticalScale(12) }}
            >
              <Text
                className={active ? "font-bold text-gray-900" : "text-gray-400"}
                style={{ fontSize: moderateScale(15) }}
              >
                {t.label}
              </Text>
              <View
                style={{
                  marginTop: verticalScale(8),
                  height: verticalScale(3),
                  width: "70%",
                  borderRadius: 999,
                  backgroundColor: active ? "#111827" : "transparent",
                }}
              />
            </Pressable>
          );
        })}
      </View>

      {trip ? (
        tab === "ticket" ? (
          <TicketList trip={trip} />
        ) : (
          <ScheduleList trip={trip} />
        )
      ) : (
        <EmptyState />
      )}
    </SafeAreaView>
  );
}

/* ───────────────── 빈 상태 ───────────────── */
function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center bg-white" style={{ gap: verticalScale(16) }}>
      <Text className="text-gray-400" style={{ fontSize: moderateScale(15) }}>
        아직 추가된 일정이 없어요
      </Text>
      <Pressable
        onPress={() => router.navigate("/course/intro")}
        className="items-center justify-center rounded-2xl"
        style={{
          paddingHorizontal: scale(24),
          height: verticalScale(48),
          backgroundColor: DOT,
        }}
      >
        <Text className="text-white font-bold" style={{ fontSize: moderateScale(15) }}>
          일정 만들러 가기
        </Text>
      </Pressable>
    </View>
  );
}

/* ───────────────── 일정표 탭 (screenshot 3) ───────────────── */
function ScheduleList({ trip }: { trip: Trip }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: DARK_BG }}
      contentContainerStyle={{ paddingBottom: verticalScale(24) }}
    >
      {/* 히어로 배너 */}
      <ImageBackground
        source={require("../../../assets/images/Main.png")}
        resizeMode="cover"
        style={{ height: verticalScale(150), justifyContent: "flex-end" }}
      >
        <View
          style={{
            paddingHorizontal: scale(20),
            paddingBottom: verticalScale(14),
          }}
        >
          <Text
            className="text-white font-bold"
            style={{ fontSize: moderateScale(20) }}
          >
            {trip.title}
          </Text>
          <Text
            className="text-white"
            style={{ fontSize: moderateScale(12), marginTop: verticalScale(4) }}
          >
            {trip.dateRange}
          </Text>
        </View>
      </ImageBackground>

      {/* 날짜 pill */}
      <View
        style={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(12),
          paddingBottom: verticalScale(4),
        }}
      >
        <View
          className="self-start bg-white items-center justify-center"
          style={{
            paddingHorizontal: scale(10),
            height: verticalScale(24),
            borderRadius: 999,
          }}
        >
          <Text
            className="font-bold"
            style={{ fontSize: moderateScale(12), color: DOT }}
          >
            {trip.datePill}
          </Text>
        </View>
      </View>

      {/* DAY 별 타임라인 */}
      {trip.days.map((day) => (
        <View key={day.label} style={{ paddingHorizontal: scale(20) }}>
          <DayHeader day={day} dark />
          {day.timeline.map((item, i) => (
            <View
              key={i}
              className="flex-row"
              style={{ paddingBottom: verticalScale(20) }}
            >
              {/* 점선 레일 */}
              <View style={{ width: scale(20), alignItems: "center" }}>
                <View
                  style={{
                    width: scale(9),
                    height: scale(9),
                    borderRadius: 999,
                    backgroundColor: DOT,
                    marginTop: verticalScale(4),
                  }}
                />
                <View
                  style={{
                    flex: 1,
                    marginTop: verticalScale(4),
                    borderLeftWidth: 1.5,
                    borderColor: "#6E6E6E",
                    borderStyle: "dashed",
                  }}
                />
              </View>

              <View style={{ flex: 1, marginLeft: scale(12) }}>
                <View
                  className="flex-row items-center"
                  style={{ gap: scale(10) }}
                >
                  {item.time ? (
                    <View
                      className="bg-white items-center justify-center"
                      style={{
                        paddingHorizontal: scale(8),
                        height: verticalScale(24),
                        borderRadius: scale(6),
                      }}
                    >
                      <Text
                        className="font-bold text-gray-900"
                        style={{ fontSize: moderateScale(13) }}
                      >
                        {item.time}
                      </Text>
                    </View>
                  ) : null}
                  <Text
                    className="text-white font-bold"
                    style={{ fontSize: moderateScale(16) }}
                  >
                    {item.station}
                  </Text>
                </View>

                {item.hasCard ? (
                  <View
                    style={{
                      marginTop: verticalScale(12),
                      height: verticalScale(150),
                      borderRadius: scale(12),
                      backgroundColor: "#808080",
                    }}
                  />
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

/* ───────────────── 승차권 탭 (screenshot 4) ───────────────── */
function TicketList({ trip }: { trip: Trip }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: LAVENDER }}
      contentContainerStyle={{
        paddingHorizontal: scale(20),
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(24),
      }}
    >
      {trip.days.map((day) => (
        <View key={day.label} style={{ marginBottom: verticalScale(8) }}>
          <DayHeader day={day} />
          <TicketCard ticket={day.ticket} />
        </View>
      ))}
    </ScrollView>
  );
}

function DayHeader({ day, dark }: { day: TripDay; dark?: boolean }) {
  return (
    <View
      className="flex-row items-center"
      style={{
        gap: scale(8),
        paddingVertical: verticalScale(14),
      }}
    >
      <View
        style={{
          width: scale(9),
          height: scale(9),
          borderRadius: 999,
          backgroundColor: DOT,
        }}
      />
      <Text
        className={dark ? "text-white font-bold" : "font-bold text-gray-900"}
        style={{ fontSize: moderateScale(16) }}
      >
        {day.label}
      </Text>
      <Text
        className={dark ? "text-gray-300" : "text-gray-400"}
        style={{ fontSize: moderateScale(14) }}
      >
        {day.date}
      </Text>
    </View>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <View
      className="overflow-hidden bg-white"
      style={{
        borderRadius: scale(14),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* 민트 헤더 */}
      <View
        className="flex-row items-center justify-between"
        style={{
          backgroundColor: MINT,
          paddingHorizontal: scale(16),
          height: verticalScale(38),
        }}
      >
        <Text
          className="font-bold text-white"
          style={{ fontSize: moderateScale(12) }}
        >
          {ticket.dateLabel}
        </Text>
        <Text
          className="text-white"
          style={{ fontSize: moderateScale(12) }}
        >
          {ticket.seatLabel}
        </Text>
      </View>

      <View style={{ paddingHorizontal: scale(16) }}>
        {/* 출발 → 도착 */}
        <View
          className="flex-row items-center justify-center"
          style={{ marginTop: verticalScale(22), gap: scale(20) }}
        >
          <Text
            className="font-medium text-gray-900"
            style={{ fontSize: moderateScale(20) }}
          >
            {ticket.from}
          </Text>
          <Feather
            name="arrow-right"
            size={moderateScale(22)}
            color="#4B5563"
          />
          <Text
            className="font-medium text-gray-900"
            style={{ fontSize: moderateScale(20) }}
          >
            {ticket.to}
          </Text>
        </View>

        {/* 시각 */}
        <View
          className="flex-row items-center justify-center"
          style={{ marginTop: verticalScale(6), gap: scale(56) }}
        >
          <Text style={{ fontSize: moderateScale(20), color: BLUE }}>
            {formatTime(ticket.departTime)}
          </Text>
          <Text style={{ fontSize: moderateScale(20), color: BLUE }}>
            {formatTime(ticket.arriveTime)}
          </Text>
        </View>

        {/* 열차명 */}
        <View
          className="justify-center"
          style={{
            marginTop: verticalScale(18),
            height: verticalScale(46),
            backgroundColor: "#F1F4FB",
            paddingHorizontal: scale(14),
          }}
        >
          <Text
            className="text-gray-700"
            style={{ fontSize: moderateScale(15) }}
          >
            {ticket.train}
          </Text>
        </View>

        {/* 좌석 정보 표 (전체가 하나의 사각형) */}
        <View
          style={{ marginTop: verticalScale(14), backgroundColor: "#F1F4FB" }}
        >
          <View className="flex-row">
            {["타는곳번호", "호차번호", "좌석번호", "운임영수증"].map((h) => (
              <View
                key={h}
                style={{ flex: 1, paddingVertical: verticalScale(6) }}
                className="items-center"
              >
                <Text
                  className="text-gray-500"
                  style={{ fontSize: moderateScale(11) }}
                >
                  {h}
                </Text>
              </View>
            ))}
          </View>
          <View
            className="flex-row"
            style={{ paddingVertical: verticalScale(12) }}
          >
            {[
              { v: ticket.platform, unit: "번" },
              { v: ticket.car, unit: "" },
              { v: ticket.seat, unit: "" },
              { v: "", unit: "" },
            ].map((c, i) => (
              <View
                key={i}
                className="flex-row items-baseline justify-center"
                style={{
                  flex: 1,
                  borderLeftWidth: i === 0 ? 0 : 1,
                  borderColor: "#DCE2F0",
                }}
              >
                <Text style={{ fontSize: moderateScale(18), color: BLUE }}>
                  {parseValue(c.v).num}
                </Text>
                <Text style={{ fontSize: moderateScale(12), color: BLUE }}>
                  {parseValue(c.v).rest}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 메타 + 승차권번호 */}
        <View
          className="flex-row items-center justify-between"
          style={{
            paddingBottom: verticalScale(14),
          }}
        >
          <Text
            className="text-gray-500"
            style={{ fontSize: moderateScale(11) }}
          >
            {ticket.meta}
          </Text>
          <Text
            className="text-gray-400"
            style={{ fontSize: moderateScale(11) }}
          >
            승차권번호 {ticket.ticketNo}
          </Text>
        </View>
      </View>

      {/* 발권 시각 검은 바 */}
      <View
        className="items-center justify-center"
        style={{ backgroundColor: "#2E2E2E", height: verticalScale(32) }}
      >
        <Text className="text-white" style={{ fontSize: moderateScale(13) }}>
          {ticket.issuedAt}
        </Text>
      </View>

      {/* 반환하기 */}
      <Pressable
        className="items-center justify-center"
        style={{ backgroundColor: "#D9D9D9", height: verticalScale(48) }}
      >
        <Text
          className="font-medium text-gray-700"
          style={{ fontSize: moderateScale(16) }}
        >
          반환하기
        </Text>
      </Pressable>
    </View>
  );
}

/** "08:00" → "08 : 00" (디자인상 콜론 양옆 여백) */
function formatTime(t: string): string {
  const [h, m] = t.split(":");
  return `${h} : ${m}`;
}

/** "9번" → {num:"9", rest:"번"}, "7호차" → {num:"7", rest:"호차"} */
function parseValue(v: string): { num: string; rest: string } {
  const match = v.match(/^(\d+)(.*)$/);
  if (!match) return { num: v, rest: "" };
  return { num: match[1], rest: match[2] };
}
