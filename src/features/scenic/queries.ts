import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { getNearbyScenicSpots, normalizeStationName } from "./api";
import { describeScenicError } from "./errors";
import { haversineMeters } from "./geo";
import {
  MOCK_LOCATION,
  MOCK_MANUAL,
  MOCK_STATIONS,
  ensureForegroundLocationPermission,
  getCurrentLatLng,
} from "./location";
import { useScenicStore } from "./store";

/**
 * 폴링 간격. 호출 = 푸시 1건이라 넉넉히 잡는다.
 *
 * 목업 위치 모드(location.ts 의 MOCK_LOCATION)에서는 2초 — 손으로 새로고침을
 * 연타하지 않아도 노선을 따라 쭉 훑으며 관광지가 잡히는 구간을 찾기 위한 값이다.
 * ⚠️ 관광지가 잡히면 그때마다 푸시가 나가므로 목업 모드 밖으로 새어나가면 안 된다.
 */
export const SCENIC_POLL_INTERVAL_MS = MOCK_LOCATION ? 2 * 1000 : 3 * 60 * 1000;

/**
 * 타이머가 도는 주기. **호출 주기가 아니다** — 매 틱마다 runTick 이 돌지만,
 * 실제 호출은 아래 (4) 최소 간격 조건을 통과할 때만 나간다.
 *
 * 간격만큼 길게 잡으면 한 번 실패했을 때 다음 시도까지 3분을 기다리게 된다.
 * 위치 획득 실패(GPS 미확보·터널)는 몇 초 뒤면 풀리는 일이 흔한데 화면에는
 * 에러가 3분간 그대로 남는다. 그래서 틱은 짧게 돌리고 억제는 조건에 맡긴다.
 *
 * ⚠️ 이 값을 줄여도 호출 빈도는 늘지 않는다. 마지막 **성공** 시각(lastCalledAt)
 *    으로 막기 때문에, 실패해서 lastCalledAt 이 안 찍혔을 때만 매 틱 재시도된다.
 */
const TICK_MS = MOCK_LOCATION ? (MOCK_MANUAL ? 60 * 60 * 1000 : 2 * 1000) : 10 * 1000;

/**
 * 이 거리(m) 미만으로 움직였으면 호출을 건너뛴다(정차·미이동 시 알림 스팸 방지).
 * 목업 모드에선 한 틱 이동량이 이 값에 걸려 조용히 스킵되는 일이 없도록 0 으로 둔다.
 */
export const SCENIC_MIN_MOVE_METERS = MOCK_LOCATION ? 0 : 500;

/**
 * 간격 직전에 앱이 포그라운드로 돌아오는 등으로 호출이 겹치지 않도록 두는 여유.
 * (예: 2분 59초 시점 복귀 → 1초 뒤 정기 호출 → 사실상 연속 2건)
 * 목업 모드에선 간격 자체가 2초라 여유를 두면 매 틱이 막힌다.
 */
const CALL_GUARD_SLACK_MS = MOCK_LOCATION ? 0 : 10 * 1000;

export type ScenicPolling = {
  loading: boolean;
  error: string | null;
  /** 사용자가 직접 누르는 새로고침 — 간격·이동거리 조건을 무시하고 즉시 호출 */
  refresh: () => void;
};

/* ------------------------------------------------------------------ */
/* 폴링 엔진 — 화면이 아니라 모듈이 소유한다                              */
/* ------------------------------------------------------------------ */

/**
 * 동시 실행 방지. 위치 획득이 느린 동안 타이머가 또 돌 수 있다.
 * 훅 로컬(useRef)이 아니라 모듈 스코프인 이유는 아래 subscribers 주석 참고.
 */
let inFlight = false;

/**
 * 이 훅을 쓰는 화면들. **여행 상세와 알림 탭이 동시에 마운트돼 있을 수 있다**
 * (탭은 한 번 방문하면 계속 살아 있고, 그 위로 상세 화면이 쌓인다).
 * 화면마다 타이머를 돌리면 호출이 2배 = 푸시가 2배로 나가므로,
 * 타이머는 모듈에 하나만 두고 화면들은 여기에 구독만 한다.
 */
const subscribers = new Set<object>();
let timer: ReturnType<typeof setInterval> | null = null;
let appStateSub: ReturnType<typeof AppState.addEventListener> | null = null;

/**
 * 주변 풍경 1회 조회.
 *
 * **react-query 를 쓰지 않는 이유**: 이 API 는 호출할 때마다 푸시를 발송한다.
 * useQuery 는 마운트·포커스·네트워크 복구 등에서 자동 refetch 하므로 사용자가
 * 화면을 드나들 때마다 알림이 나간다. 호출 시점을 완전히 통제하려고 명시적
 * 타이머 + 스토어 캐시로 구현했다.
 *
 * 호출을 건너뛰는 경우:
 *  1) 세션 없음(탑승 종료)
 *  2) 이미 조회 중
 *  3) 앱이 백그라운드 — 포그라운드 복귀 시 재개
 *  4) 직전 **성공** 호출로부터 3분이 지나지 않음(화면 재진입·포그라운드 복귀 중복 방지).
 *     실패했을 때는 이 조건이 비어 있어 TICK_MS(10초)마다 다시 시도한다.
 *  5) 직전 **호출 지점** 대비 이동이 500m 미만
 */
async function runTick(force = false) {
  // 최신 상태를 렌더와 무관하게 읽는다.
  const {
    session,
    lastPosition,
    lastCalledAt,
    error,
    markCalled,
    setResult,
    setStatus,
  } = useScenicStore.getState();

  if (!session) return; // (1) 세션 종료
  if (inFlight) return; // (2)
  if (!force && AppState.currentState !== "active") return; // (3) 백그라운드

  const now = Date.now();
  // (4) 최소 간격 — 화면 재진입/포그라운드 복귀로 인한 중복 호출 차단.
  //     lastCalledAt 은 **호출에 성공했을 때만** 찍히므로(markCalled), 위치 획득이나
  //     조회가 실패한 동안에는 이 조건에 걸리지 않고 매 틱(TICK_MS) 재시도된다.
  if (
    !force &&
    error === null &&
    lastCalledAt !== null &&
    now - lastCalledAt < SCENIC_POLL_INTERVAL_MS - CALL_GUARD_SLACK_MS
  ) {
    return;
  }

  inFlight = true;
  setStatus({ loading: true });
  try {
    const granted = await ensureForegroundLocationPermission();
    if (!granted) throw new Error("위치 권한이 필요해요.");

    const here = await getCurrentLatLng();
    if (!here) throw new Error("현재 위치를 확인하지 못했어요.");

    // (5) 미이동 스킵 — lastPosition 은 '마지막 호출 지점'이라 여기서 갱신하지 않는다.
    //     갱신해버리면 천천히 이동할 때 기준점이 따라와 영영 임계값을 못 넘긴다.
    if (
      !force &&
      error === null &&
      lastPosition &&
      haversineMeters(lastPosition, here) < SCENIC_MIN_MOVE_METERS
    ) {
      return;
    }

    // 목업 노선이 역명까지 덮어쓰는 경우에만 세션 값을 무시한다(location.ts 의
    // MOCK_ROUTE 참고). null 이면 실제 여행 구간 그대로 질의한다.
    const fromStation = MOCK_STATIONS?.from ?? session.fromStation;
    const toStation = MOCK_STATIONS?.to ?? session.toStation;

    const res = await getNearbyScenicSpots({
      lat: here.lat,
      lng: here.lng,
      from_station: fromStation,
      to_station: toStation,
    });

    if (MOCK_LOCATION) {
      // 0건일 때 좌표가 문제인지 구간이 문제인지 콘솔에서 바로 가리기 위한 로그.
      // 정규화된 이름으로 찍어야 실제로 나간 요청과 일치한다.
      console.log(
        `[scenic] ${normalizeStationName(fromStation)}→${normalizeStationName(toStation)}` +
          ` @ ${here.lat.toFixed(5)},${here.lng.toFixed(5)}`,
        `→ ${res.feature_count}건`,
        res.items.map((i) => `${i.name}(${i.side},${i.distance_m}m)`),
      );
    }

    markCalled(here, Date.now());
    setResult(res);
    setStatus({ error: null });
  } catch (e) {
    setStatus({ error: describeScenicError(e) });
  } finally {
    inFlight = false;
    setStatus({ loading: false });
  }
}

/** 모듈 타이머 기동. 이미 돌고 있으면 아무것도 하지 않는다(중복 호출 방지). */
function startPolling() {
  if (timer) return;

  // 기동 직후 1회. force 가 아니므로 방금 호출했다면 (4)에 걸려 조용히 넘어간다.
  // 탑승 시작 시에는 스토어가 초기화되어 lastCalledAt 이 null → 즉시 1회 호출된다.
  void runTick();

  // 틱은 짧게, 억제는 runTick 의 (4) 조건이 한다(TICK_MS 주석 참고).
  timer = setInterval(() => void runTick(), TICK_MS);
  appStateSub = AppState.addEventListener("change", (state) => {
    if (state === "active") void runTick(); // 백그라운드 동안 건너뛴 주기 보충
  });
}

/** 구독자가 모두 사라졌을 때 타이머 정리. */
function stopPolling() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  appStateSub?.remove();
  appStateSub = null;
}

/**
 * 탑승 세션이 있는 동안 주변 풍경을 주기적으로 조회한다.
 *
 * 여러 화면에서 동시에 호출해도 안전하다 — 타이머는 모듈에 하나뿐이고,
 * 마지막 화면이 언마운트될 때만 멈춘다. 세션 자체는 스토어에 남아 있어
 * 화면에 다시 들어오면 이어서 폴링한다.
 */
export function useScenicPolling(): ScenicPolling {
  const scheduleIdx = useScenicStore((s) => s.session?.scheduleIdx ?? null);
  // 로딩·에러는 스토어에 있다 — 폴링을 실제로 돌리는 화면이 어디든 두 화면이 같은 상태를 본다.
  const loading = useScenicStore((s) => s.loading);
  const error = useScenicStore((s) => s.error);

  // 이 화면을 구독자 집합에서 식별하는 토큰. 값 자체는 쓰지 않는다.
  const token = useRef({});

  useEffect(() => {
    if (scheduleIdx === null) return;

    const self = token.current;
    subscribers.add(self);
    startPolling();

    return () => {
      subscribers.delete(self);
      // 다른 화면이 아직 보고 있으면 계속 돌린다.
      if (subscribers.size === 0) stopPolling();
    };
  }, [scheduleIdx]);

  const refresh = useCallback(() => {
    void runTick(true);
  }, []);

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
