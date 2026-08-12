import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";

const KEY = "marketing_consent";

/**
 * '이벤트 및 마케팅 활용동의' 상태.
 *
 * ⚠️ 서버에 대응 필드가 없어 **기기 로컬**에만 저장한다. 즉 기기를 바꾸거나 앱을 지우면
 *    동의 이력이 사라지고, 법적으로 요구되는 '동의 시점·내용 기록'도 남지 않는다.
 *    TODO(backend): 알림 설정 API 에 마케팅 활용동의 필드가 추가되면 그쪽으로 옮길 것.
 */
async function readConsent(): Promise<boolean | null> {
  try {
    const v = await SecureStore.getItemAsync(KEY);
    if (v === null) return null; // 한 번도 정한 적 없음
    return v === "true";
  } catch {
    return null;
  }
}

async function writeConsent(value: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, value ? "true" : "false");
  } catch {
    // 저장 실패해도 화면 동작은 막지 않는다.
  }
}

export type MarketingConsent = {
  /** 로딩 전에는 null */
  consent: boolean | null;
  setConsent: (value: boolean) => void;
};

/**
 * @param serverEventAlarm 알림 설정의 event_alarm. 저장된 값이 없을 때의 초기값으로 쓴다.
 *
 * 초기값을 서버 값에서 가져오는 이유: 이 항목은 나중에 생겼으므로 기존 사용자는 저장된
 * 동의가 없다. 그때 무조건 false 로 두면 이벤트 알림을 켜 둔 사용자가 갑자기 꺼진 것처럼
 * 보이고 잠긴다. 이미 알림을 켜 뒀다면 활용에도 동의한 것으로 보고 이어받는다.
 */
export function useMarketingConsent(
  serverEventAlarm: boolean | undefined,
): MarketingConsent {
  const [consent, setState] = useState<boolean | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || serverEventAlarm === undefined) return;
    initialized.current = true;

    let alive = true;
    void (async () => {
      const stored = await readConsent();
      if (!alive) return;
      if (stored !== null) {
        setState(stored);
        return;
      }
      setState(serverEventAlarm);
      await writeConsent(serverEventAlarm);
    })();
    return () => {
      alive = false;
    };
  }, [serverEventAlarm]);

  const setConsent = useCallback((value: boolean) => {
    setState(value); // 화면은 즉시 반응, 저장은 뒤따라간다
    void writeConsent(value);
  }, []);

  return { consent, setConsent };
}
