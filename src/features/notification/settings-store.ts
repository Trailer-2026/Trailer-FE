import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

/**
 * 알림 설정. 백엔드 저장 없이 기기 로컬에만 보관한다(웹의 localStorage 대응).
 * RN 엔 localStorage 가 없어, 이미 설치된 expo-secure-store 에 JSON 으로 저장한다.
 * (auth 토큰과 동일한 저장소 사용 — AsyncStorage 를 새로 깔아 dev client 를
 *  재빌드할 필요가 없다. 정석대로 가려면 AsyncStorage 어댑터로 교체하면 됨.)
 */
export type NotificationSettings = {
  /** 이벤트 및 마케팅 알림 */
  marketing: boolean;
  /** 이벤트 및 마케팅 활용동의 */
  marketingConsent: boolean;
  /** 기차역 풍경 알림 */
  scenery: boolean;
};

const KEY = "notification_settings";
const DEFAULTS: NotificationSettings = {
  marketing: true,
  marketingConsent: true,
  scenery: true,
};

type State = NotificationSettings & {
  /** SecureStore 에서 값을 읽어왔는지 여부. false 동안엔 화면에서 로딩 처리. */
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSetting: (key: keyof NotificationSettings, value: boolean) => void;
};

export const useNotificationSettings = create<State>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
        set({ ...DEFAULTS, ...parsed, hydrated: true });
        return;
      }
    } catch {
      // 파싱/읽기 실패 시 기본값으로 진행
    }
    set({ hydrated: true });
  },

  setSetting: (key, value) => {
    set({ [key]: value } as Partial<State>);
    const { marketing, marketingConsent, scenery } = get();
    // 로컬 저장(실패해도 UI 는 유지). 저장 자체가 빨라 await 하지 않는다.
    void SecureStore.setItemAsync(
      KEY,
      JSON.stringify({ marketing, marketingConsent, scenery }),
    );
  },
}));
