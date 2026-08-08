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
  /** 갤러리 첫 선택 — 기존 목록을 대체(촬영시각 오름차순으로 정렬) */
  setAssets: (assets: ReelsMediaAsset[]) => void;
  /** 편집 화면의 + 버튼 — 이미 있는 uri 는 건너뛰고, 새 사진만 촬영시각순으로 뒤에 붙임 */
  addAssets: (assets: ReelsMediaAsset[]) => void;
  /** 드래그 정렬 결과 반영 */
  reorder: (from: number, to: number) => void;
  remove: (uri: string) => void;
  clear: () => void;
};

/**
 * 촬영시각 오름차순(오래된 → 최근). 렌더는 보낸 순서를 그대로 쓰므로(photos-ordered)
 * 처음 보이는 순서가 곧 영상 순서다 — 여행 순서대로 시작해 두고 드래그로 고치게 한다.
 * taken_at 이 없는 사진은 뒤로 밀되 고른 순서를 유지한다.
 */
function byTakenAt(assets: ReelsMediaAsset[]): ReelsMediaAsset[] {
  return [...assets].sort((a, b) => {
    const ta = a.taken_at ? Date.parse(a.taken_at) : Infinity;
    const tb = b.taken_at ? Date.parse(b.taken_at) : Infinity;
    return ta - tb;
  });
}

export const useReelsCreateStore = create<CreateState & CreateActions>(
  (set) => ({
    assets: [],

    setAssets: (assets) => set({ assets: byTakenAt(assets) }),

    addAssets: (incoming) =>
      set((state) => {
        const seen = new Set(state.assets.map((a) => a.uri));
        const fresh = incoming.filter((a) => !seen.has(a.uri));
        // 이미 정렬해 둔(또는 사용자가 드래그로 고친) 순서는 건드리지 않고 뒤에 붙인다.
        return { assets: [...state.assets, ...byTakenAt(fresh)] };
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
