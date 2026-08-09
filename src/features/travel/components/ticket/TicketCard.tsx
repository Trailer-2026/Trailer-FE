import Feather from "@expo/vector-icons/Feather";
import { Pressable, View } from "react-native";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { formatClockTime, formatDaySlash, formatTicketDate } from "../../format";
import type { TravelTicket } from "../../types";

const ACCENT = "#5E84F4";
const TICKET_MINT = "#7ED8C3";
const BOX_BG = "#F1F4FB";
const LINE = "#E5E7EB";

/**
 * 승차권 1매 카드 — 실물 승차권 모양(민트 띠 + 구간·시각 + 열차 + 좌석 정보).
 *
 * 타는곳번호·운임영수증은 실물 승차권엔 있지만 API 응답에 없어서 넣지 않았다.
 * 호차·좌석도 예매 정보라 비어 있을 수 있어 값이 있을 때만 칸을 만든다.
 */
export default function TicketCard({
  ticket,
  onDelete,
}: {
  ticket: TravelTicket;
  onDelete: () => void;
}) {
  const cells = [
    { label: "호차번호", value: ticket.car_no, suffix: "호차" },
    { label: "좌석번호", value: ticket.seat_no, suffix: "" },
  ].filter((c) => !!c.value);

  const trainLabel = [ticket.train_grade, ticket.train_no]
    .filter(Boolean)
    .join(" ");

  return (
    <View>
      {/* DAY 배지 */}
      <View
        className="flex-row items-center"
        style={{ gap: scale(8), marginBottom: verticalScale(10) }}
      >
        <View
          style={{
            width: scale(10),
            height: scale(10),
            borderRadius: 999,
            backgroundColor: ACCENT,
          }}
        />
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(17) }}
        >
          DAY {String(ticket.day_no).padStart(2, "0")}
        </Text>
        <Text
          className="text-gray-500"
          style={{ fontSize: moderateScale(14) }}
        >
          {formatDaySlash(ticket.date)}
        </Text>
      </View>

      <View
        className="bg-white"
        style={{
          borderRadius: scale(10),
          overflow: "hidden",
          borderWidth: 1,
          borderColor: LINE,
        }}
      >
        {/* 민트 띠 — 승차 일자 */}
        <View
          className="flex-row items-center justify-between"
          style={{
            backgroundColor: TICKET_MINT,
            paddingHorizontal: scale(16),
            paddingVertical: verticalScale(10),
          }}
        >
          <Text
            className="text-white font-semibold"
            style={{ fontSize: moderateScale(13) }}
          >
            {formatTicketDate(ticket.date)}
          </Text>
          <Text
            className="text-white font-semibold"
            style={{ fontSize: moderateScale(12) }}
          >
            좌석지정권 1매
          </Text>
        </View>

        {/* 구간 · 시각 */}
        <View
          style={{
            paddingHorizontal: scale(16),
            paddingTop: verticalScale(26),
            paddingBottom: verticalScale(20),
          }}
        >
          <View className="flex-row items-center justify-center" style={{ gap: scale(18) }}>
            <Text
              className="font-bold text-gray-900"
              style={{ fontSize: moderateScale(22) }}
              numberOfLines={1}
            >
              {ticket.dep_station}
            </Text>
            <Feather
              name="arrow-right"
              size={moderateScale(24)}
              color="#111827"
            />
            <Text
              className="font-bold text-gray-900"
              style={{ fontSize: moderateScale(22) }}
              numberOfLines={1}
            >
              {ticket.arr_station}
            </Text>
          </View>

          <View
            className="flex-row items-center justify-center"
            style={{ gap: scale(40), marginTop: verticalScale(12) }}
          >
            <TimeText value={ticket.dep_time} />
            <TimeText value={ticket.arr_time} />
          </View>
        </View>

        {/* 열차 등급·번호 */}
        {trainLabel ? (
          <View
            style={{
              marginHorizontal: scale(16),
              backgroundColor: BOX_BG,
              borderRadius: scale(6),
              paddingHorizontal: scale(16),
              paddingVertical: verticalScale(14),
            }}
          >
            <Text
              className="font-semibold text-gray-900"
              style={{ fontSize: moderateScale(16) }}
            >
              {trainLabel}
            </Text>
          </View>
        ) : null}

        {/* 호차 · 좌석 */}
        {cells.length > 0 ? (
          <View
            className="flex-row"
            style={{
              marginTop: verticalScale(16),
              marginHorizontal: scale(16),
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: LINE,
            }}
          >
            {cells.map((cell, i) => (
              <View
                key={cell.label}
                className="items-center"
                style={{
                  flex: 1,
                  paddingVertical: verticalScale(12),
                  borderLeftWidth: i === 0 ? 0 : 1,
                  borderColor: LINE,
                }}
              >
                <Text
                  className="text-gray-500"
                  style={{ fontSize: moderateScale(12) }}
                >
                  {cell.label}
                </Text>
                <Text
                  className="font-bold"
                  style={{
                    fontSize: moderateScale(20),
                    color: ACCENT,
                    marginTop: verticalScale(10),
                  }}
                >
                  {cell.value}
                  <Text
                    className="font-medium"
                    style={{ fontSize: moderateScale(13), color: ACCENT }}
                  >
                    {cell.suffix}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* 삭제 — 실물 승차권의 '반환하기' 자리 */}
        <Pressable
          onPress={onDelete}
          className="items-center justify-center active:opacity-70"
          style={{
            marginTop: verticalScale(16),
            height: verticalScale(48),
            backgroundColor: "#D9DCE1",
          }}
          accessibilityRole="button"
          accessibilityLabel="승차권 삭제"
        >
          <Text
            className="font-semibold text-gray-700"
            style={{ fontSize: moderateScale(15) }}
          >
            삭제하기
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/** "08:00:00" → "08 : 00" (실물 승차권처럼 콜론 좌우를 띄운다) */
function TimeText({ value }: { value: string }) {
  const hhmm = formatClockTime(value);
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":");
  return (
    <Text
      className="font-bold"
      style={{ fontSize: moderateScale(20), color: ACCENT }}
    >
      {h} : {m}
    </Text>
  );
}
