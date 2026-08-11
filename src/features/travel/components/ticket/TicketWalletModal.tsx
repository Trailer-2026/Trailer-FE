import Feather from "@expo/vector-icons/Feather";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { describeScheduleError } from "../../errors";
import { useDeleteSchedule, useTravelTickets } from "../../queries";
import type { TravelTicket } from "../../types";
import AddScheduleModal from "../schedule/AddScheduleModal";
import TicketCard from "./TicketCard";

const ACCENT = "#5E84F4";

/** loading: 조회 중 · list: 저장된 승차권 보기 · form: 새 승차권 입력 */
type Mode = "loading" | "list" | "form";

/**
 * 승차권 화면. 'KTX 티켓 정보 추가하기' 카드와 '내 일정' 탭 헤더 티켓 아이콘이
 * 공통으로 쓴다(같은 여행이면 어느 쪽으로 들어와도 같은 화면).
 *
 * 진입 시 승차권이 있으면 목록, 없으면 곧바로 입력 폼으로 간다.
 * 호출부는 조건부 렌더로 열고 닫는다(열 때마다 새로 마운트되어 상태가 초기화됨).
 */
export default function TicketWalletModal({
  travelIdx,
  onClose,
}: {
  travelIdx: number;
  onClose: () => void;
}) {
  const {
    data: tickets,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useTravelTickets(travelIdx);
  const del = useDeleteSchedule(travelIdx);
  const [mode, setMode] = useState<Mode>("loading");

  /**
   * 방금 저장했는지. state 가 아니라 ref 인 이유: AddScheduleModal 이 저장 성공 시
   * onSaved() 와 onClose() 를 연달아 부르는데, 그 사이 state 는 아직 갱신 전이라
   * onClose 안에서 읽으면 저장 사실을 알 수 없다(→ 목록 대신 화면이 닫혀버린다).
   */
  const justSaved = useRef(false);

  /**
   * 목록/폼 분기는 **진입 시 한 번만** 정한다.
   * 매번 개수로 판단하면 마지막 한 장을 지웠을 때 화면이 갑자기 입력 폼으로 튄다.
   */
  useEffect(() => {
    if (mode !== "loading" || isLoading || !tickets) return;
    setMode(tickets.length > 0 ? "list" : "form");
  }, [mode, isLoading, tickets]);

  const confirmDelete = (ticket: TravelTicket) => {
    Alert.alert(
      "승차권을 삭제할까요?",
      `${ticket.dep_station} → ${ticket.arr_station} 승차권이 일정에서도 함께 사라져요.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () =>
            del.mutate(ticket.schedule_idx, {
              onError: (e) =>
                Alert.alert("삭제 실패", describeScheduleError(e)),
            }),
        },
      ],
    );
  };

  /**
   * 입력 폼은 이 모달을 **감싸지 않고 대신** 렌더한다.
   * 안드로이드에서 Modal 안에 Modal 을 넣으면 안쪽 윈도우가 터치를 제대로 못 받는다.
   */
  if (mode === "form") {
    return (
      <AddScheduleModal
        visible
        kind="train"
        travelIdx={travelIdx}
        // 저장하면 목록으로. 승차권이 없어 폼으로 바로 들어온 경우도 마찬가지.
        onSaved={() => {
          justSaved.current = true;
          setMode("list");
        }}
        onClose={() => {
          // 방금 저장했거나 이미 승차권이 있으면 목록으로, 아니면 화면을 닫는다.
          if (justSaved.current || (tickets && tickets.length > 0)) {
            justSaved.current = false;
            setMode("list");
          } else {
            onClose();
          }
        }}
      />
    );
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
        {/* 헤더 — 앱 공통(뒤로 + 제목) + 추가 */}
        <View
          className="flex-row items-center justify-between"
          style={{
            paddingHorizontal: scale(20),
            ...headerBarStyle(),
          }}
        >
          <View className="flex-row items-center">
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
              승차권
            </Text>
          </View>

          <Pressable
            onPress={() => setMode("form")}
            hitSlop={10}
            className="flex-row items-center active:opacity-60"
            style={{ gap: scale(4) }}
            accessibilityRole="button"
            accessibilityLabel="승차권 추가"
          >
            <Feather name="plus" size={moderateScale(18)} color={ACCENT} />
            <Text
              className="font-bold"
              style={{ fontSize: moderateScale(14), color: ACCENT }}
            >
              추가
            </Text>
          </Pressable>
        </View>

        {/* 저장 직후 재조회 중에는 빈 상태가 잠깐 스치지 않게 스피너로 덮는다. */}
        {mode === "loading" || isLoading || (isFetching && !tickets?.length) ? (
          <Centered>
            <ActivityIndicator color={ACCENT} />
          </Centered>
        ) : error ? (
          <Centered>
            <Text
              className="font-semibold text-gray-900"
              style={{ fontSize: moderateScale(15) }}
            >
              승차권을 불러오지 못했어요
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="bg-gray-800 rounded-full active:opacity-80"
              style={{
                marginTop: verticalScale(12),
                paddingHorizontal: scale(20),
                paddingVertical: verticalScale(10),
              }}
            >
              <Text
                className="text-white font-semibold"
                style={{ fontSize: moderateScale(14) }}
              >
                다시 시도
              </Text>
            </Pressable>
          </Centered>
        ) : !tickets || tickets.length === 0 ? (
          <Centered>
            <Text
              className="text-gray-400"
              style={{ fontSize: moderateScale(15) }}
            >
              등록된 승차권이 없어요
            </Text>
            <Pressable
              onPress={() => setMode("form")}
              className="items-center justify-center active:opacity-80"
              style={{
                marginTop: verticalScale(16),
                paddingHorizontal: scale(24),
                height: verticalScale(48),
                borderRadius: scale(10),
                backgroundColor: ACCENT,
              }}
            >
              <Text
                className="text-white font-bold"
                style={{ fontSize: moderateScale(15) }}
              >
                승차권 추가하기
              </Text>
            </Pressable>
          </Centered>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: scale(20),
              paddingTop: verticalScale(8),
              paddingBottom: verticalScale(32),
              gap: verticalScale(24),
            }}
          >
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.schedule_idx}
                ticket={ticket}
                onDelete={() => confirmDelete(ticket)}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ paddingHorizontal: scale(24) }}
    >
      {children}
    </View>
  );
}
