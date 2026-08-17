import { router } from "expo-router";
import { useCallback } from "react";

import { useConfirmDialog } from "@/src/components/ConfirmDialog";
import { useCurrentTravel } from "@/src/features/travel/queries";

/**
 * AI 일정 추천(`/course/intro`) 진입 게이트.
 *
 * 진행중(ONGOING)·예정(PLANNED) 여행이 하나라도 있으면 새 추천을 막고 안내 다이얼로그를 띄운다.
 * GET /api/travels/current 가 둘 중 하나만 돌려주므로(없으면 null) 이 응답 유무가 곧 판정 기준이다.
 *
 * ```tsx
 * const { gateDialog, startAiCourse } = useAiCourseGate();
 * <Pressable onPress={startAiCourse} />
 * {gateDialog}
 * ```
 */
export function useAiCourseGate() {
  const { data: current } = useCurrentTravel();
  const { dialog, notify } = useConfirmDialog();

  const startAiCourse = useCallback(() => {
    if (current) {
      notify(
        current.status === "ONGOING"
          ? {
              title: "여행 중에는 만들 수 없어요",
              message: `'${current.title}' 여행이 진행 중이에요.\n이번 여행이 끝난 뒤에 새 일정을 추천받을 수 있어요.`,
            }
          : {
              title: "이미 예정된 여행이 있어요",
              message: `'${current.title}' 여행이 예정돼 있어요.\n기존 여행을 다녀오거나 삭제한 뒤에 새 일정을 추천받을 수 있어요.`,
            },
      );
      return;
    }
    router.push("/course/intro");
  }, [current, notify]);

  return { gateDialog: dialog, startAiCourse };
}
