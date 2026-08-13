import { Modal, Pressable, TextInput, View } from "react-native";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#4FD1C5";

/** 서버 title 상한(넘으면 업로드는 400, 제목 수정은 422). */
export const TITLE_MAX = 100;

/**
 * 릴스 제목 입력 카드(다크). 업로드 직전과 편집 화면의 제목 수정이 같은 UI 를 쓴다.
 * 비워서 확인하면 제목 없는 릴스가 된다 — 그래서 빈 값도 유효한 입력이다.
 */
export default function TitleInputCard({
  visible,
  title,
  onChangeTitle,
  onCancel,
  onSubmit,
  heading,
  hint,
  submitLabel = "저장",
  submitting = false,
}: {
  visible: boolean;
  title: string;
  onChangeTitle: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  heading: string;
  /** 부제(파일 크기 등). 없으면 기본 안내만 보여준다. */
  hint?: string;
  submitLabel?: string;
  submitting?: boolean;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View
        className="flex-1 items-center justify-center"
        style={{
          backgroundColor: "rgba(0,0,0,0.65)",
          paddingHorizontal: scale(28),
        }}
      >
        <View
          className="w-full"
          style={{
            backgroundColor: "#1C1C1C",
            borderRadius: scale(20),
            borderWidth: 1,
            borderColor: "#333333",
            paddingVertical: verticalScale(24),
            paddingHorizontal: scale(20),
            elevation: 12,
            shadowColor: "#000000",
          }}
        >
          <Text
            className="text-white"
            style={{ fontSize: moderateScale(17), fontWeight: 650 as never }}
          >
            {heading}
          </Text>
          <Text
            className="font-medium"
            style={{
              color: "#9CA3AF",
              fontSize: moderateScale(12),
              marginTop: verticalScale(6),
            }}
          >
            비워 두면 제목 없이 저장돼요{hint ? ` · ${hint}` : ""}
          </Text>

          <TextInput
            value={title}
            onChangeText={onChangeTitle}
            placeholder="예) 강릉 바다 드라이브"
            placeholderTextColor="#6B7280"
            maxLength={TITLE_MAX}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            editable={!submitting}
            className="text-white"
            style={{
              marginTop: verticalScale(16),
              height: verticalScale(46),
              borderRadius: scale(12),
              backgroundColor: "#262626",
              paddingHorizontal: scale(14),
              fontSize: moderateScale(14),
            }}
          />
          <Text
            className="text-right"
            style={{
              color: "#6B7280",
              fontSize: moderateScale(11),
              marginTop: verticalScale(6),
            }}
          >
            {title.length}/{TITLE_MAX}
          </Text>

          <View
            className="flex-row"
            style={{ marginTop: verticalScale(16), gap: scale(10) }}
          >
            <Pressable
              onPress={onCancel}
              disabled={submitting}
              className="flex-1 items-center justify-center active:opacity-80"
              style={{
                height: verticalScale(46),
                borderRadius: 999,
                backgroundColor: "#333333",
              }}
              accessibilityRole="button"
              accessibilityLabel="취소"
            >
              <Text
                className="font-bold text-white"
                style={{ fontSize: moderateScale(15) }}
              >
                취소
              </Text>
            </Pressable>
            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              className="flex-1 items-center justify-center active:opacity-80"
              style={{
                height: verticalScale(46),
                borderRadius: 999,
                backgroundColor: ACCENT,
                opacity: submitting ? 0.6 : 1,
              }}
              accessibilityRole="button"
              accessibilityLabel={submitLabel}
            >
              <Text
                className="font-bold"
                style={{ color: "#06322E", fontSize: moderateScale(15) }}
              >
                {submitting ? "저장 중..." : submitLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
