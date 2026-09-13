import { create } from "zustand";

/**
 * 가벼운 온라인/오프라인 감지 — OS 연결 상태를 직접 보는 NetInfo 없이,
 * 실제 API 요청이 네트워크 에러(ERR_NETWORK)로 실패/성공하는 것만으로 판단한다.
 * (NetInfo 는 새 네이티브 모듈이라 추가하면 dev-client 를 다시 빌드해야 해서 보류)
 *
 * 상태가 "바뀔 때"만 토스트 1건을 띄운다 — 매 요청마다 안 띄우려고 이미 같은
 * 상태면 markOnline/markOffline 이 조용히 무시한다.
 */
type ToastKind = "offline" | "online";

type NetworkStatusState = {
  online: boolean;
  toast: { kind: ToastKind; id: number } | null;
  markOffline: () => void;
  markOnline: () => void;
  clearToast: () => void;
};

export const useNetworkStatus = create<NetworkStatusState>((set, get) => ({
  online: true,
  toast: null,
  markOffline: () => {
    if (!get().online) return;
    set({ online: false, toast: { kind: "offline", id: Date.now() } });
  },
  markOnline: () => {
    if (get().online) return;
    set({ online: true, toast: { kind: "online", id: Date.now() } });
  },
  clearToast: () => set({ toast: null }),
}));
