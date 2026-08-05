import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { getNearbyScenicSpots } from "./api";
import { describeScenicError } from "./errors";
import { haversineMeters } from "./geo";
import { ensureForegroundLocationPermission, getCurrentLatLng } from "./location";
import { useScenicStore } from "./store";

/** 폴링 간격. 호출 = 푸시 1건이라 넉넉히 잡는다. */
export const SCENIC_POLL_INTERVAL_MS = 3 * 60 * 1000;

/** 이 거리(m) 미만으로 움직였으면 호출을 건너뛴다(정차·미이동 시 알림 스팸 방지). */
export const SCENIC_MIN_MOVE_METERS = 500;

/**
 * 간격 직전에 앱이 포그라운드로 돌아오는 등으로 호출이 겹치지 않도록 두는 여유.
 * (예: 2분 59초 시점 복귀 → 1초 뒤 정기 호출 → 사실상 연속 2건)
 */
const CALL_GUARD_SLACK_MS = 10 * 1000;

export type ScenicPolling = {
  loading: boolean;
  error: string | null;
  /** 사용자가 직접 누르는 새로고침 — 간격·이동거리 조건을 무시하고 즉시 호출 */
  refresh: () => void;
};

/**
 * 탑승 세션이 있는 동안 주변 풍경을 주기적으로 조회한다.
 *
 * **react-query 를 쓰지 않는 이유**: 이 API 는 호출할 때마다 푸시를 발송한다.
 * useQuery 는 마운트·포커스·네트워크 복구 등에서 자동 refetch 하므로 사용자가
 * 화면을 드나들 때마다 알림이 나간다. 호출 시점을 완전히 통제하려고 명시적
 * 타이머 + 스토어 캐시로 구현했다.
 *
 * 호출을 건너뛰는 경우:
 *  1) 세션 없음(탑승 종료)
 *  2) 앱이 백그라운드 — 포그라운드 복귀 시 재개
 *  3) 직전 **호출 지점** 대비 이동이 500m 미만
 *  4) 직전 호출로부터 3분이 지나지 않음(화면 재진입·포그라운드 복귀 중복 방지)
 *
 * 타이머·AppState 구독은 이 훅이 언마운트될 때(= 화면 이탈) 정리된다.
 * 세션 자체는 스토어에 남아 있어 화면에 다시 들어오면 이어서 폴링한다.
 */
export function useScenicPolling(): ScenicPolling {
  const scheduleIdx = useScenicStore((s) => s.session?.scheduleIdx ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 동시 실행 방지. 위치 획득이 느린 동안 타이머가 또 돌 수 있다.
  const inFlight = useRef(false);
  // 언마운트 뒤 setState 로 경고가 나지 않도록.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const runTick = useCallback(async (force = false) => {
    // 최신 상태를 렌더와 무관하게 읽는다 → 콜백이 안정적이라 타이머가 재시작되지 않는다.
    const { session, lastPosition, lastCalledAt, markCalled, setResult } =
      useScenicStore.getState();

    if (!session) return; // (1) 세션 종료
    if (inFlight.current) return;
    if (!force && AppState.currentState !== "active") return; // (2) 백그라운드

    const now = Date.now();
    // (4) 최소 간격 — 화면 재진입/포그라운드 복귀로 인한 중복 호출 차단
    if (
      !force &&
      lastCalledAt !== null &&
      now - lastCalledAt < SCENIC_POLL_INTERVAL_MS - CALL_GUARD_SLACK_MS
    ) {
      return;
    }

    inFlight.current = true;
    if (mounted.current) setLoading(true);
    try {
      const granted = await ensureForegroundLocationPermission();
      if (!granted) throw new Error("위치 권한이 필요해요.");

      const here = await getCurrentLatLng();
      if (!here) throw new Error("현재 위치를 확인하지 못했어요.");

      // (3) 미이동 스킵 — lastPosition 은 '마지막 호출 지점'이라 여기서 갱신하지 않는다.
      //     갱신해버리면 천천히 이동할 때 기준점이 따라와 영영 임계값을 못 넘긴다.
      if (
        !force &&
        lastPosition &&
        haversineMeters(lastPosition, here) < SCENIC_MIN_MOVE_METERS
      ) {
        return;
      }

      const res = await getNearbyScenicSpots({
        lat: here.lat,
        lng: here.lng,
        from_station: session.fromStation,
        to_station: session.toStation,
      });

      markCalled(here, Date.now());
      setResult(res);
      if (mounted.current) setError(null);
    } catch (e) {
      if (mounted.current) setError(describeScenicError(e));
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (scheduleIdx === null) return;

    // 진입 직후 1회. force 가 아니므로 방금 호출했다면 (4)에 걸려 조용히 넘어간다.
    // 탑승 시작 시에는 스토어가 초기화되어 lastCalledAt 이 null → 즉시 1회 호출된다.
    runTick();

    const timer = setInterval(() => runTick(), SCENIC_POLL_INTERVAL_MS);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") runTick(); // 백그라운드 동안 건너뛴 주기 보충
    });

    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [scheduleIdx, runTick]);

  const refresh = useCallback(() => {
    void runTick(true);
  }, [runTick]);

  return { loading, error, refresh };
}

/**
 * 1분마다 갱신되는 현재 시각.
 * 출발 시각 ±30분 배너가 시간이 흐르면 저절로 뜨고 사라지게 하는 용도.
 */
export function useMinuteTick(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
