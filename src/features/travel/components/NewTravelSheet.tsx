import { Modal, Pressable } from "react-native";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";

/**
 * '새 여행 일정 만들기' 하단 시트 — AI 추천 / 직접 만들기 두 갈래.
 * 일정 탭의 빈 상태 버튼에서 띄운다.
 */
export default function NewTravelSheet({
  visible,
  onClose,
  onRecommend,
  onManual,
}: {
  visible: boolean;
  onClose: () => void;
  onRecommend: () => void;
  onManual: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 딤 영역을 누르면 닫힘. 시트 자체는 Pressable 로 눌림 전파를 막는다. */}
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
            paddingTop: verticalScale(24),
            paddingBottom: verticalScale(40),
          }}
        >
          <Text
            className="font-bold text-gray-900 text-center"
            style={{ fontSize: moderateScale(17) }}
          >
            일정 만들기
          </Text>

          <ChoiceRow
            emoji="✨"
            highlighted
            onPress={onRecommend}
            style={{ marginTop: verticalScale(24) }}
          >
            <Text className="font-bold" style={{ color: ACCENT }}>
              추천{" "}
            </Text>
            <Text className="font-bold text-gray-800">AI 일정 추천받기</Text>
          </ChoiceRow>

          <ChoiceRow
            emoji="✏️"
            onPress={onManual}
            style={{ marginTop: verticalScale(12) }}
          >
            <Text className="font-bold text-gray-800">직접 일정 만들기</Text>
          </ChoiceRow>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** 아이콘은 왼쪽 고정, 문구는 카드 가운데 정렬. */
function ChoiceRow({
  emoji,
  highlighted,
  onPress,
  style,
  children,
}: {
  emoji: string;
  highlighted?: boolean;
  onPress: () => void;
  style?: object;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center active:opacity-70"
      style={{
        height: verticalScale(56),
        borderRadius: scale(10),
        borderWidth: 1,
        borderColor: highlighted ? "#C7D7FF" : "transparent",
        backgroundColor: highlighted ? "#F2F6FF" : "#F5F5F7",
        ...style,
      }}
    >
      <Text
        style={{
          position: "absolute",
          left: scale(18),
          fontSize: moderateScale(20),
        }}
      >
        {emoji}
      </Text>
      <Text style={{ fontSize: moderateScale(15) }}>{children}</Text>
    </Pressable>
  );
}
