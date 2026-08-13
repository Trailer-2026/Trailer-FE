import { Modal, Pressable, View } from "react-native";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

export type MediaSource = "camera" | "gallery";

const ROWS: { key: MediaSource; label: string }[] = [
  { key: "camera", label: "촬영하기" },
  { key: "gallery", label: "갤러리에서 선택" },
];

/**
 * "사진을 어떻게 추가할까요?" 선택 시트.
 *
 * 네이티브 Alert 를 쓰지 않는다 — 안드로이드 DialogModule 의 콜백은 한 번만 쓸 수 있는데
 * 버튼 클릭보다 dismiss 가 먼저 이를 소비해서, 버튼 onPress 가 JS 로 전달되지 않는다.
 */
export default function MediaSourceSheet({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (source: MediaSource) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#1C1C1C",
            borderTopLeftRadius: scale(16),
            borderTopRightRadius: scale(16),
            paddingTop: verticalScale(16),
            paddingBottom: verticalScale(24),
          }}
        >
          <Text
            className="text-center text-gray-400"
            style={{
              fontSize: moderateScale(13),
              paddingBottom: verticalScale(12),
            }}
          >
            사진을 어떻게 추가할까요?
          </Text>

          {ROWS.map((row) => (
            <Pressable
              key={row.key}
              onPress={() => onSelect(row.key)}
              className="active:opacity-60"
              style={{
                paddingHorizontal: scale(20),
                paddingVertical: verticalScale(16),
              }}
              accessibilityRole="button"
              accessibilityLabel={row.label}
            >
              <Text
                className="text-center font-semibold text-white"
                style={{ fontSize: moderateScale(15) }}
              >
                {row.label}
              </Text>
            </Pressable>
          ))}

          <View
            style={{
              height: 1,
              backgroundColor: "#2E2E2E",
              marginVertical: verticalScale(4),
            }}
          />

          <Pressable
            onPress={onClose}
            className="active:opacity-60"
            style={{
              paddingHorizontal: scale(20),
              paddingVertical: verticalScale(16),
            }}
            accessibilityRole="button"
            accessibilityLabel="취소"
          >
            <Text
              className="text-center text-gray-400"
              style={{ fontSize: moderateScale(15) }}
            >
              취소
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
