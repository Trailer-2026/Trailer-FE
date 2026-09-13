import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { CACHE_POLICY } from "@/src/api/cache-policy";
import { queryClient } from "@/src/api/query-client";

import { calibrateScenicPlan, getScenicPlan } from "./api";
import { scenicKeys } from "./keys";
import {
  MOCK_LOCATION,
  getCurrentLatLng,
  hasForegroundLocationPermission,
} from "./location";
import { useScenicStore } from "./store";
import type { ScenicPlanResponse } from "./types";

/**
 * 풍경 알림은 **서버가 보낸다.** 예전에는 앱이 3분마다 GET /nearby 를 부르고 서버가
 * 호출마다 푸시를 쐈기 때문에, 이 파일이 타이머·이동거리·최소 간격으로 발송 빈도를
 * 조절하는 폴링 엔진이었다. 지금은 서버가 열차 시간표로 통과 시각을 계산해 직접
 * 발송하므로 앱이 폴링할 이유가 없다 — 남은 일은 둘뿐이다.
 *
 *  1) 시각표(GET /plan)를 받아 화면에 그린다.          → useScenicPlanQuery
 *  2) 포그라운드에 올라올 때 GPS 로 지연을 보정한다.     → useScenicCalibration
 */

/* ------------------------------------------------------------------ */
/* 시각표 조회                                                          */
/* ------------------------------------------------------------------ */

/**
 * 탑승 구간의 풍경 시각표. 세션이 있는 동안만 조회한다.
 *
 * 부작용이 없는 순수 조회라 react-query 에 맡긴다(마운트·재진입 refetch 가 늘어도
 * 알림이 늘지 않는다). 갱신 시점:
 *  - 세션 시작 / 화면 진입: staleTime 지나면 자동
 *  - 포그라운드 복귀: useScenicCalibration 이 보정 응답으로 캐시를 덮어쓴다
 *  - 풍경 푸시 수신: notification/handlers.ts 가 refreshScenicPlan 을 부른다
 *
 * "지나갔는지"는 화면이 eta 와 현재 시각으로 직접 판단한다(useMinuteTick). is_sent 는
 * 서버가 푸시를 보냈다는 표시라 12분 묶음 등으로 eta 가 지나도 false 일 수 있다.
 */
export function useScenicPlanQuery() {
  const riding = useScenicStore((s) => s.session !== null);
  return useQuery({
    queryKey: scenicKeys.plan(),
    queryFn: getScenicPlan,
    enabled: riding,
    ...CACHE_POLICY.LIVE,
  });
}

/** 시각표를 다시 받게 한다. 풍경 푸시가 도착했을 때(is_sent 갱신) 부른다. */
export function refreshScenicPlan(): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: scenicKeys.plan() });
}

/* ------------------------------------------------------------------ */
/* GPS 보정                                                            */
/* ------------------------------------------------------------------ */

/**
 * 같은 이유로 연달아 보정하지 않는 최소 간격. 포그라운드 복귀가 짧게 반복될 때
 * (알림창 열었다 닫기 등) 좌표 획득 + 요청이 그때마다 나가지 않게 한다.
 * 목업 모드에선 버튼으로 한 칸씩 밀며 확인하므로 간격을 두지 않는다.
 */
const CALIBRATE_MIN_INTERVAL_MS = MOCK_LOCATION ? 0 : 60 * 1000;

let lastCalibratedAt = 0;
let calibrating = false;

/**
 * 현재 좌표로 시각표를 보정하고 캐시를 덮어쓴다.
 *
 * 건너뛰는 경우: 세션 없음 / 이미 진행 중 / 최소 간격 미만(force 면 무시) /
 * 위치 권한 없음(**권한 창을 띄우지 않는다** — 권한은 AutoBoarding 이 탑승 시작 때
 * 한 번 묻는다) / 좌표 획득 실패.
 *
 * 서버는 좌표가 경로에서 20km 넘게 벗어나거나 차이가 90분을 넘으면 보정 없이 그대로
 * 돌려주므로(api.ts) 응답은 항상 캐시에 넣어도 안전하다.
 *
 * @returns 보정 요청이 실제로 나갔으면 true
 */
export async function calibrateNow({ force = false } = {}): Promise<boolean> {
  if (!useScenicStore.getState().session) return false;
  if (calibrating) return false;
  if (!force && Date.now() - lastCalibratedAt < CALIBRATE_MIN_INTERVAL_MS) {
    return false;
  }
  if (!(await hasForegroundLocationPermission())) return false;

  calibrating = true;
  try {
    const here = await getCurrentLatLng();
    if (!here) return false;

    const plan = await calibrateScenicPlan(here);
    lastCalibratedAt = Date.now();
    queryClient.setQueryData<ScenicPlanResponse>(scenicKeys.plan(), plan);

    if (MOCK_LOCATION) {
      // 목업 좌표를 밀 때마다 지연·eta 가 어떻게 움직이는지 콘솔에서 바로 본다.
      console.log(
        `[scenic] calibrate @ ${here.lat.toFixed(5)},${here.lng.toFixed(5)}`,
        `→ delay ${plan.delay_minutes}분,`,
        plan.items.map((i) => `${i.name ?? i.category}@${i.eta.slice(11, 16)}`),
      );
    }
    return true;
  } catch (e) {
    // 보정은 있으면 좋은 것이지 필수가 아니다 — 실패해도 예정 시각대로 알림은 온다.
    if (__DEV__) console.log("[scenic] 보정 실패:", e);
    return false;
  } finally {
    calibrating = false;
  }
}

/**
 * 세션이 있는 동안 GPS 보정을 돌린다 — 세션 시작 때 1회, 포그라운드 복귀 때 1회.
 * 문서 권장("포그라운드로 올라올 때 한 번")과 같고, 주기적으로 보내지 않는다.
 *
 * 앱 루트(AutoBoarding)에서 한 번만 쓴다. 화면마다 걸면 복귀 한 번에 여러 번 나간다.
 *
 * 보정을 건너뛴 복귀(위치 권한 없음 등)에는 시각표만 다시 받는다 — 백그라운드에 있던
 * 동안 서버가 보낸 푸시(is_sent)와 지연이 화면에 반영되도록.
 */
export function useScenicCalibration(): void {
  const scheduleIdx = useScenicStore((s) => s.session?.scheduleIdx ?? null);

  useEffect(() => {
    if (scheduleIdx === null) return;

    // 새 구간은 직전 구간의 간격 제한과 무관하게 바로 보정한다.
    lastCalibratedAt = 0;
    void calibrateNow();

    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void calibrateNow().then((sent) => {
        if (!sent) void refreshScenicPlan();
      });
    });
    return () => sub.remove();
  }, [scheduleIdx]);
}

/* ------------------------------------------------------------------ */
/* 시계                                                                */
/* ------------------------------------------------------------------ */

/**
 * 1분마다 갱신되는 현재 시각.
 * 출발 시각 ±30분 배너, 시각표의 "지나감" 판정, 카드 배경 시간대처럼
 * 시간이 흐르면 저절로 바뀌어야 하는 표시에 쓴다.
 */
export function useMinuteTick(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
