import { create } from "zustand";

import { MOCK_REELS } from "./mock";
import type { Reels } from "./types";

type ReelsState = {
  /** 피드에 보여줄 릴스 목록. 지금은 목업, 추후 GET /api/reels 응답으로 교체 */
  reels: Reels[];
};

type ReelsActions = {
  /** 하트 탭 → 낙관적 업데이트(즉시 UI 반영) */
  toggleLike: (reelsIdx: number) => void;
};

export const useReelsStore = create<ReelsState & ReelsActions>((set) => ({
  reels: MOCK_REELS,

  toggleLike: (reelsIdx) => {
    // 1) 낙관적 업데이트: 서버 응답을 기다리지 않고 로컬 상태를 먼저 뒤집는다.
    set((state) => ({
      reels: state.reels.map((r) =>
        r.reels_idx === reelsIdx
          ? {
              ...r,
              liked: !r.liked,
              like_count: r.liked ? r.like_count - 1 : r.like_count + 1,
            }
          : r,
      ),
    }));

    // 2) TODO(API 연결): 실제 릴스 API 가 붙으면 여기서 서버에 확정 요청을 보낸다.
    //
    //    const next = get().reels.find((r) => r.reels_idx === reelsIdx);
    //    if (!next) return;
    //    const request = next.liked ? likeReels : unlikeReels;  // ./api
    //    request(reelsIdx)
    //      .then(({ liked, like_count }) => {
    //        // 서버 확정값으로 덮어쓰기 (다른 기기에서 누른 좋아요까지 반영됨)
    //        set((state) => ({
    //          reels: state.reels.map((r) =>
    //            r.reels_idx === reelsIdx ? { ...r, liked, like_count } : r,
    //          ),
    //        }));
    //      })
    //      .catch(() => {
    //        // 실패 시 롤백 — 위 낙관적 업데이트를 되돌린다.
    //        set((state) => ({
    //          reels: state.reels.map((r) =>
    //            r.reels_idx === reelsIdx
    //              ? {
    //                  ...r,
    //                  liked: !r.liked,
    //                  like_count: r.liked ? r.like_count - 1 : r.like_count + 1,
    //                }
    //              : r,
    //          ),
    //        }));
    //      });
  },
}));
