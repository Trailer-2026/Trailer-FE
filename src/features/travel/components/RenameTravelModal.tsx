import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";

import { Text } from "@/src/components/Text";
import { describeScheduleError } from "@/src/features/travel/errors";
import { useUpdateTravelTitle } from "@/src/features/travel/queries";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";

/**
 * 여행 이름 변경 모달.
 * - 빈 문자열/공백을 그대로 보내면 서버가 지역·기간 기반 자동 제목으로 되돌린다.
 *   → '자동 생성으로 되돌리기' UX 로 별도 안내 노출.
 * - 성공 시 캐시는 훅에서 invalidate 되므로 여기서는 닫기만.
 */
export default function RenameTravelModal({
  visible,
  travelIdx,
  currentTitle,
  onClose,
}: {
  visible: boolean;
  travelIdx: number;
  currentTitle: string;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentTitle);
  const update = useUpdateTravelTitle(travelIdx);

  // 모달이 열릴 때마다 현재 제목으로 리셋.
  useEffect(() => {
    if (visible) setValue(currentTitle);
  }, [visible, currentTitle]);

  if (!visible) return null;

  const trimmed = value.trim();
  const willAutoGenerate = trimmed.length === 0;

  const submit = () => {
    update.mutate(value, {
      onSuccess: () => onClose(),
      onError: (e) =>
        Alert.alert("이름 변경 실패", describeScheduleError(e)),
    });
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Pressable
          onPress={onClose}
          className="flex-1 items-center justify-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.4)",
            paddingHorizontal: scale(24),
          }}
        >
          <Pressable
            className="bg-white"
            style={{
              width: "100%",
              borderRadius: scale(16),
              paddingHorizontal: scale(20),
              paddingTop: verticalScale(20),
              paddingBottom: verticalScale(16),
            }}
          >
            <Text
              className="font-bold text-gray-900"
              style={{ fontSize: moderateScale(17) }}
            >
              여행 이름 바꾸기
            </Text>
            <Text
              className="text-gray-500"
              style={{
                fontSize: moderateScale(12),
                marginTop: verticalScale(6),
              }}
            >
              비워두면 지역·기간으로 자동 생성돼요.
            </Text>

            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="예) 부산 뚜벅이 여행"
              placeholderTextColor="#B0B4BD"
              maxLength={40}
              autoFocus
              style={{
                marginTop: verticalScale(14),
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: scale(10),
                paddingHorizontal: scale(12),
                paddingVertical: verticalScale(10),
                fontSize: moderateScale(15),
                color: "#111827",
              }}
            />

            {willAutoGenerate ? (
              <Text
                style={{
                  fontSize: moderateScale(11),
                  color: ACCENT,
                  marginTop: verticalScale(6),
                }}
              >
                이대로 저장하면 자동 제목으로 되돌아가요
              </Text>
            ) : null}

            <View
              className="flex-row justify-end"
              style={{ marginTop: verticalScale(18), gap: scale(6) }}
            >
              <Pressable
                onPress={onClose}
                hitSlop={6}
                className="active:opacity-60"
                style={{
                  paddingHorizontal: scale(14),
                  paddingVertical: verticalScale(10),
                }}
              >
                <Text
                  className="text-gray-500"
                  style={{ fontSize: moderateScale(14) }}
                >
                  취소
                </Text>
              </Pressable>
              <Pressable
                onPress={submit}
                disabled={update.isPending}
                className="active:opacity-70"
                style={{
                  paddingHorizontal: scale(16),
                  paddingVertical: verticalScale(10),
                  borderRadius: scale(8),
                  backgroundColor: ACCENT,
                  opacity: update.isPending ? 0.6 : 1,
                  minWidth: scale(64),
                  alignItems: "center",
                }}
              >
                {update.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text
                    className="text-white font-bold"
                    style={{ fontSize: moderateScale(14) }}
                  >
                    저장
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
