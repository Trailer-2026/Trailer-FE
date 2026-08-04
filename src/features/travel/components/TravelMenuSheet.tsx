import Feather from "@expo/vector-icons/Feather";
import { Modal, Pressable, View } from "react-native";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const DANGER = "#EF4444";

/**
 * 여행 요약 카드의 ⋮ 를 누르면 뜨는 바텀시트 메뉴.
 * 세 줄: 내 여행 영상 만들기 / 여행 이름 바꾸기 / 삭제하기.
 * 백드롭 탭 또는 각 액션 선택으로 닫힌다.
 */
export default function TravelMenuSheet({
  visible,
  travelTitle,
  onClose,
  onMakeVideo,
  onRename,
  onDelete,
}: {
  visible: boolean;
  travelTitle: string;
  onClose: () => void;
  /** 아직 미구현이면 undefined 로 두면 비활성 표시. */
  onMakeVideo?: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        {/* 내부 탭이 백드롭까지 버블링 되지 않게 Pressable 로 stop */}
        <Pressable
          className="bg-white"
          style={{
            borderTopLeftRadius: scale(20),
            borderTopRightRadius: scale(20),
            paddingHorizontal: scale(20),
            paddingTop: verticalScale(18),
            paddingBottom: verticalScale(28),
          }}
        >
          <Text
            className="text-gray-500"
            style={{
              fontSize: moderateScale(12),
              marginBottom: verticalScale(4),
            }}
            numberOfLines={1}
          >
            {travelTitle}
          </Text>
          <View style={{ height: verticalScale(6) }} />

          <Row
            icon="video"
            label="내 여행 영상 만들기"
            onPress={onMakeVideo}
          />
          <Row icon="edit-2" label="여행 이름 바꾸기" onPress={onRename} />
          <Row
            icon="trash-2"
            label="삭제하기"
            onPress={onDelete}
            danger
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  /** undefined 면 아직 미구현 → 비활성('준비 중'). */
  onPress?: () => void;
  danger?: boolean;
}) {
  const disabled = !onPress;
  const color = disabled ? "#C4C4C4" : danger ? DANGER : "#111827";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center active:opacity-60"
      style={{
        paddingVertical: verticalScale(14),
        gap: scale(14),
      }}
    >
      <Feather name={icon} size={moderateScale(18)} color={color} />
      <Text style={{ fontSize: moderateScale(15), color }}>
        {label}
        {disabled ? (
          <Text
            className="text-gray-400"
            style={{ fontSize: moderateScale(12) }}
          >
            {"  준비 중"}
          </Text>
        ) : null}
      </Text>
    </Pressable>
  );
}

