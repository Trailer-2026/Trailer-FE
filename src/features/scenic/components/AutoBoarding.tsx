import { useEffect, useMemo } from "react";

import {
  useCurrentTravel,
  useTravelDetail,
} from "@/src/features/travel/queries";

import {
  ensureForegroundLocationPermission,
  resetMockLocation,
} from "../location";
import { disableScenicPush } from "../push";
import { useMinuteTick, useScenicPolling } from "../queries";
import { collectTrainSegments, findActiveSegment } from "../segments";
import { useScenicStore } from "../store";

/**
 * 권한을 이미 물어본 구간 — 거절당했을 때 1분마다 팝업이 다시 뜨지 않게 한다.
 * 모듈 스코프라 앱을 껐다 켜면 다시 한 번 물어본다.
 */
let permissionAskedFor: number | null = null;

/**
 * 자동 탑승 — 일정에 등록된 열차 **출발 시각이 되면** 풍경 알림을 켜고,
 * **도착 시각이 지나면** 끈다. '탑승 시작' 버튼을 누르지 않아도 된다.
 *
 * 화면이 아니라 앱 루트에 붙는 감시자다(렌더 결과 없음). 어느 탭을 보고 있든
 * 출발 시각이 되면 세션이 시작되고, 알림 탭의 풍경 카드가 그대로 이어받는다.
 *
 * **한계:** 앱이 켜져 있을 때만 동작한다. 출발 시각에 앱이 꺼져 있었다면
 * 다음에 앱을 열었을 때 아직 도착 전이면 그 시점에 시작된다.
 * (백그라운드 시작은 expo-notifications·백그라운드 위치가 필요 — 이번 범위 밖)
 *
 * 사용자가 직접 '탑승 종료'를 누른 구간은 다시 켜지 않는다(store 의
 * skipAutoScheduleIdx). 도착 시각을 모르는 구간(end_time 없음)도 대상이 아니다.
 */
export default function AutoBoarding() {
  const { data: current } = useCurrentTravel();
  // 여행중일 때만 감시한다 — 예정 여행의 열차 시각은 아직 올 일이 없다.
  const travelIdx =
    current?.status === "ONGOING" ? current.travel_idx : undefined;
  const { data: detail } = useTravelDetail(travelIdx);

  /**
   * 진행 중인 여행이 없다고 **확정**됐는지.
   *
   * 서버는 여행이 끝나면 data 를 null 로 준다. undefined 는 아직 로딩 중이거나
   * 조회에 실패했다는 뜻이라, 이걸 "여행 없음"으로 오해하면 네트워크가 잠깐
   * 끊긴 사이에 멀쩡히 탑승 중인 세션을 꺼버린다.
   */
  const travelResolved = current !== undefined;

  const now = useMinuteTick();
  const session = useScenicStore((s) => s.session);
  const skipAutoScheduleIdx = useScenicStore((s) => s.skipAutoScheduleIdx);
  const startRiding = useScenicStore((s) => s.startRiding);
  const stopRiding = useScenicStore((s) => s.stopRiding);

  const active = useMemo(() => {
    if (!detail) return null;
    return findActiveSegment(collectTrainSegments(detail), now);
  }, [detail, now]);

  useEffect(() => {
    // 권한 동의 창을 기다리는 사이 이 이펙트가 낡았는지 표시한다(아래 cleanup).
    let cancelled = false;

    if (travelIdx == null) {
      // 여행이 COMPLETED 로 넘어가면 travelIdx 가 사라진다. 예전에는 여기서 그냥
      // return 해 아래 종료 로직에 닿지 못했고, 끝난 여행의 세션이 스토어에 남아
      // 앱을 끌 때까지 폴링(= 푸시)이 계속 나갔다.
      if (travelResolved && session) stopRiding();
      return;
    }

    // 지금 진행 중인 여행의 활성 구간과 일치할 때만 세션을 유지한다.
    //
    // travelIdx 가 다른 경우: 계정 전환(A 로 탑승 중 로그아웃 → B 로 로그인)이나
    // 여행이 연달아 바뀐 상황. 예전에는 이 세션을 그냥 두고 return 했는데,
    // 그러면 끝난 여행(또는 남의 계정)의 구간으로 폴링이 계속 돌아 푸시가 나갔다.
    //
    // scheduleIdx 가 다른 경우: 도착 시각이 지났거나 다음 구간으로 넘어감.
    if (session) {
      if (session.travelIdx !== travelIdx) {
        stopRiding();
        return;
      }
      // detail 이 없으면 active 가 무조건 null 이라(58줄) "구간 없음"과 "아직 모름"이
      // 구분되지 않는다. 그대로 두면 상세가 비어 있는 동안 멀쩡한 세션이 꺼진다.
      // 판단을 미룰 뿐이므로 다른 여행의 세션 정리(위 분기)보다 뒤에 둔다 —
      // 앞에 두면 계정 전환 직후 남의 세션을 종료하지 못한다.
      if (!detail) return;
      if (active?.scheduleIdx !== session.scheduleIdx) stopRiding();
      return;
    }

    if (!active) return;
    if (skipAutoScheduleIdx === active.scheduleIdx) return; // 사용자가 직접 종료한 구간
    if (permissionAskedFor === active.scheduleIdx) return; // 이미 물어보고 거절당함

    permissionAskedFor = active.scheduleIdx;
    void (async () => {
      // 권한이 있으면 묻지 않고 통과, 없으면 여기서 동의 창이 뜬다.
      const granted = await ensureForegroundLocationPermission();
      if (!granted) return; // permissionAskedFor 를 남겨 이 구간은 다시 묻지 않는다
      permissionAskedFor = null; // 허용됐으면 다음 구간도 정상 판단

      // /nearby 를 처음 부르기 직전에 풍경 푸시를 꺼 둔다(push.ts 참고).
      // 응답을 기다리지 않는다 — 늦어도 다음 폴링에는 반영된다.
      void disableScenicPush();

      // 동의 창을 오래 띄워두는 동안 상황이 바뀔 수 있다 — 구간이 끝났거나,
      // 여행이 종료됐거나, 사용자가 탑승 종료를 눌렀거나. 아래 travelIdx·active 는
      // 창이 뜨던 시점의 값이라 그대로 쓰면 이미 지난 구간으로 세션이 시작된다.
      // 그 사이 값이 하나라도 바뀌었으면 이 이펙트는 정리되고 새 값으로 다시 도니
      // 여기서는 조용히 빠지면 된다(권한은 이미 받았으므로 다음 회차는 창 없이 통과).
      if (cancelled) return;

      resetMockLocation();
      startRiding({
        travelIdx,
        scheduleIdx: active.scheduleIdx,
        fromStation: active.fromStation,
        toStation: active.toStation,
        label: active.label,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    travelIdx,
    travelResolved,
    detail,
    active,
    session,
    skipAutoScheduleIdx,
    startRiding,
    stopRiding,
  ]);

  // 세션을 켜는 쪽이 폴링도 책임진다. 알림 탭에 두면 탭이 lazy mount 라
  // 사용자가 그 탭을 한 번도 열지 않는 동안 타이머가 아예 안 돌아 푸시가 0건이 된다.
  // 이 컴포넌트는 앱 루트에 항상 마운트돼 있어 어느 화면을 보든 폴링이 유지된다.
  // (세션이 없으면 훅이 알아서 쉰다)
  useScenicPolling();

  return null;
}
