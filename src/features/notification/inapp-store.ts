import { create } from "zustand";

/**
 * 인앱 알림(4번째 탭 표시용). 저장하지 않고 세션 메모리에만 둔다 —
 * 앱을 재시작하면 사라진다. "여행 담기" 같은 프론트 처리 결과를 알림 탭에 띄우는 용도.
 */
export type InAppNotification = {
  id: string;
  message: string;
  createdAt: number; // epoch ms
};

type State = {
  items: InAppNotification[];
  /** 새 알림을 맨 위에 추가. */
  add: (message: string) => void;
  clear: () => void;
};

export const useInAppNotifications = create<State>((set) => ({
  items: [],
  add: (message) =>
    set((s) => ({
      items: [
        {
          id: `n_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
          message,
          createdAt: Date.now(),
        },
        ...s.items,
      ],
    })),
  clear: () => set({ items: [] }),
}));
