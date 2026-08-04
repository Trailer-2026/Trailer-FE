import { Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const DANGER = "#EF4444";

/**
 * 여행 요약 카드의 ⋮ 를 누르면 뜨는 바텀시트 메뉴.
 * 세 줄: 내 여행 영상 만들기 / 여행 이름 바꾸기 / 삭제하기.
 * 시트가 하단 탭바 영역까지 흰색으로 덮어올라온다(백드롭 탭·각 액션 선택으로 닫힘).
 */
export default function TravelMenuSheet({
  visible,
  onClose,
  onMakeVideo,
  onRename,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  /** 아직 미구현이면 undefined 로 두면 비활성 표시. */
  onMakeVideo?: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        {/* 내부 탭이 백드롭으로 버블링 되지 않게 Pressable 로 stop.
            시트가 화면 바닥까지 붙고, 홈 인디케이터/제스처 영역만큼만 안쪽 패딩 확보. */}
        <Pressable
          className="bg-white"
          style={{
            borderTopLeftRadius: scale(20),
            borderTopRightRadius: scale(20),
            paddingHorizontal: scale(20),
            paddingTop: verticalScale(12),
            paddingBottom: insets.bottom + verticalScale(12),
          }}
        >
          <Row label="내 여행 영상 만들기" onPress={onMakeVideo} />
          <Row label="여행 이름 바꾸기" onPress={onRename} />
          <Row label="삭제하기" onPress={onDelete} danger />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({
  label,
  onPress,
  danger = false,
}: {
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
      className="active:opacity-60"
      style={{ paddingVertical: verticalScale(14) }}
    >
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
