import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const DANGER = "#EF4444";

/**
 * 일정 항목의 ⋮ 를 누르면 뜨는 바텀시트 — 사진 추가 / 편집 / 삭제.
 * 여행 카드의 TravelMenuSheet 와 같은 형태로 맞춰 앱 안에서 일관되게 보이게 한다.
 */
export default function ScheduleItemMenuSheet({
  visible,
  title,
  onClose,
  onAddPhoto,
  onEdit,
  onDelete,
}: {
  visible: boolean;
  /** 어떤 항목인지 헷갈리지 않도록 시트 상단에 항목 제목을 보여준다. */
  title: string;
  onClose: () => void;
  /** 없으면 사진 추가 항목을 그리지 않는다. */
  onAddPhoto?: () => void;
  onEdit: () => void;
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
        {/* 시트 내부 탭이 백드롭으로 버블링 되지 않게 Pressable 로 막는다. */}
        <Pressable
          className="bg-white"
          style={{
            borderTopLeftRadius: scale(20),
            borderTopRightRadius: scale(20),
            paddingHorizontal: scale(20),
            paddingTop: verticalScale(16),
            paddingBottom: insets.bottom + verticalScale(12),
          }}
        >
          <Text
            className="text-gray-400"
            numberOfLines={1}
            style={{
              fontSize: moderateScale(13),
              marginBottom: verticalScale(4),
            }}
          >
            {title}
          </Text>
          {onAddPhoto ? (
            <>
              <Row label="사진 추가하기" onPress={onAddPhoto} />
              <Divider />
            </>
          ) : null}
          <Row label="편집하기" onPress={onEdit} />
          <Divider />
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
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-60"
      style={{ paddingVertical: verticalScale(14) }}
    >
      <Text
        style={{ fontSize: moderateScale(15), color: danger ? DANGER : "#111827" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: "#F1F3F9" }} />;
}
