import { create } from "zustand";

import type { ReelsMediaAsset } from "./types";

/**
 * 영상 만들기 플로우(선택 → 미리보기/정렬 → 생성)에서 고른 미디어를 들고 있는 스토어.
 * 화면(create ↔ edit) 사이를 오가며 유지돼야 해서 라우터 params 대신 스토어를 쓴다.
 */
type CreateState = {
  assets: ReelsMediaAsset[];
};

type CreateActions = {
  /** 갤러리 첫 선택 — 기존 목록을 대체 */
  setAssets: (assets: ReelsMediaAsset[]) => void;
  /** 편집 화면의 + 버튼 — 뒤에 이어붙임. 이미 있는 uri 는 건너뛴다. */
  addAssets: (assets: ReelsMediaAsset[]) => void;
  /** 드래그 정렬 결과 반영 */
  reorder: (from: number, to: number) => void;
  remove: (uri: string) => void;
  clear: () => void;
};

export const useReelsCreateStore = create<CreateState & CreateActions>(
  (set) => ({
    assets: [],

    setAssets: (assets) => set({ assets }),

    addAssets: (incoming) =>
      set((state) => {
        const seen = new Set(state.assets.map((a) => a.uri));
        const fresh = incoming.filter((a) => !seen.has(a.uri));
        return { assets: [...state.assets, ...fresh] };
      }),

    reorder: (from, to) =>
      set((state) => {
        const next = [...state.assets];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return { assets: next };
      }),

    remove: (uri) =>
      set((state) => ({ assets: state.assets.filter((a) => a.uri !== uri) })),

    clear: () => set({ assets: [] }),
  }),
);
