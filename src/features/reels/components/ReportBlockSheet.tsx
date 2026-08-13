import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

/** 신고 등 위험 동작 문구 색 — 편집 화면(studio)과 같은 값. */
const DANGER = "#E5484D";

/**
 * 신고·차단 시트 — 릴스 액션바 ⋯ 와 댓글 길게 누르기가 같은 UI 를 쓴다.
 *
 * 신고 API 가 아직 없어 호출부는 두 항목 모두 차단(POST /api/blocks/{user_idx})으로 처리한다.
 */
export default function ReportBlockSheet({
  visible,
  name,
  reportLabel,
  onReport,
  onBlock,
  onClose,
}: {
  visible: boolean;
  /** 시트 상단에 표시할 대상(작성자 닉네임). */
  name: string;
  /** 예: "이 릴스 신고하기" / "이 댓글 신고하기". */
  reportLabel: string;
  onReport: () => void;
  onBlock: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={onClose}
      >
        {/* 시트 본문 — 배경 탭으로 닫히지 않게 이벤트를 여기서 끊는다. */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#1C1C1C",
            borderTopLeftRadius: scale(16),
            borderTopRightRadius: scale(16),
            paddingTop: verticalScale(8),
            paddingBottom: verticalScale(16),
          }}
        >
          <View
            style={{
              paddingHorizontal: scale(20),
              paddingTop: verticalScale(8),
              paddingBottom: verticalScale(4),
            }}
          >
            <Text
              className="text-gray-500"
              numberOfLines={1}
              style={{ fontSize: moderateScale(11) }}
            >
              {name}
            </Text>
          </View>

          <SheetRow
            label={reportLabel}
            color={DANGER}
            icon={
              <MaterialCommunityIcons
                name="alarm-light"
                size={moderateScale(18)}
                color={DANGER}
              />
            }
            onPress={onReport}
          />
          <SheetRow
            label="이 사용자 차단하기"
            icon={
              <Feather name="slash" size={moderateScale(17)} color="#FFFFFF" />
            }
            onPress={onBlock}
          />
          <SheetRow label="닫기" muted onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SheetRow({
  label,
  muted = false,
  color,
  icon,
  onPress,
}: {
  label: string;
  muted?: boolean;
  /** 문구 색 override — 신고처럼 위험 동작만 지정한다. */
  color?: string;
  icon?: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center active:opacity-60"
      style={{
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(14),
        gap: scale(10),
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text
        className={muted ? "text-gray-500" : "font-semibold text-white"}
        style={{ fontSize: moderateScale(14), ...(color ? { color } : null) }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
