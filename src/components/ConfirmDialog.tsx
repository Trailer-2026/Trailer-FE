import { useCallback, useState } from "react";
import { Modal, Pressable, View } from "react-native";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";
/** 신고·차단처럼 되돌리기 어려운 동작의 버튼 색 — ReportBlockSheet 와 같은 값. */
const DANGER = "#E5484D";

type DialogState = {
  title: string;
  message?: string;
  /** 확인 버튼 문구. */
  confirmLabel: string;
  /** null 이면 확인 버튼만 있는 안내 다이얼로그가 된다. */
  cancelLabel?: string | null;
  /** true 면 확인 버튼이 빨간색(신고·차단 등). */
  danger?: boolean;
  onConfirm?: () => void;
};

/**
 * 앱 UI 에 맞춘 확인/안내 다이얼로그.
 *
 * OS 기본 `Alert.alert` 는 안드로이드 시스템 테마를 그대로 써서 앱 디자인과 따로 논다.
 * 여행 이름 바꾸기 모달과 같은 카드(흰 배경 · radius 16 · 반투명 검정 배경)로 맞췄다.
 */
export default function ConfirmDialog({
  visible,
  state,
  onClose,
}: {
  visible: boolean;
  state: DialogState | null;
  onClose: () => void;
}) {
  if (!visible || !state) return null;

  const hasCancel = state.cancelLabel !== null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center"
        style={{
          backgroundColor: "rgba(0,0,0,0.4)",
          paddingHorizontal: scale(24),
        }}
      >
        {/* 카드 안쪽 탭으로 닫히지 않게 이벤트를 여기서 끊는다. */}
        <Pressable
          onPress={() => {}}
          className="bg-white"
          style={{
            width: "100%",
            borderRadius: scale(16),
            paddingHorizontal: scale(20),
            paddingTop: verticalScale(22),
            paddingBottom: verticalScale(14),
          }}
        >
          <Text
            className="font-bold text-gray-900"
            style={{ fontSize: moderateScale(17), lineHeight: moderateScale(24) }}
          >
            {state.title}
          </Text>

          {state.message ? (
            <Text
              className="text-gray-500"
              style={{
                fontSize: moderateScale(13),
                lineHeight: moderateScale(20),
                marginTop: verticalScale(8),
              }}
            >
              {state.message}
            </Text>
          ) : null}

          <View
            className="flex-row justify-end items-center"
            style={{ marginTop: verticalScale(20), gap: scale(6) }}
          >
            {hasCancel ? (
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
                  {state.cancelLabel ?? "취소"}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => {
                onClose();
                state.onConfirm?.();
              }}
              className="active:opacity-70"
              style={{
                paddingHorizontal: scale(16),
                paddingVertical: verticalScale(10),
                borderRadius: scale(8),
                backgroundColor: state.danger ? DANGER : ACCENT,
                minWidth: scale(72),
                alignItems: "center",
              }}
            >
              <Text
                className="text-white font-bold"
                style={{ fontSize: moderateScale(14) }}
              >
                {state.confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * `Alert.alert` 자리에 그대로 끼워 넣는 훅.
 *
 * ```tsx
 * const { dialog, ask, notify } = useConfirmDialog();
 * ask({ title: "차단할까요?", confirmLabel: "차단하기", danger: true, onConfirm: run });
 * // 렌더 트리 어딘가에 {dialog}
 * ```
 *
 * 다이얼로그는 한 번에 하나만 뜬다 — 확인을 누르면 먼저 닫고 `onConfirm` 을 실행하므로,
 * 그 안에서 `notify` 를 부르면 결과 다이얼로그로 자연스럽게 교체된다.
 */
export function useConfirmDialog() {
  const [state, setState] = useState<DialogState | null>(null);

  const ask = useCallback((options: DialogState) => setState(options), []);

  const notify = useCallback(
    (options: { title: string; message?: string; confirmLabel?: string }) =>
      setState({
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? "확인",
        cancelLabel: null,
      }),
    [],
  );

  const close = useCallback(() => setState(null), []);

  const dialog = (
    <ConfirmDialog visible={state !== null} state={state} onClose={close} />
  );

  return { dialog, ask, notify, close };
}
