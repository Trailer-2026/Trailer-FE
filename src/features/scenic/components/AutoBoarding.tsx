import { useEffect, useMemo } from "react";

import { useNotificationSettingsQuery } from "@/src/features/notification/queries";
import {
  useCurrentTravel,
  useTravelDetail,
} from "@/src/features/travel/queries";

import {
  ensureForegroundLocationPermission,
  resetMockLocation,
} from "../location";
import { useMinuteTick, useScenicCalibration } from "../queries";
import { collectTrainSegments, findActiveSegment } from "../segments";
import { useScenicStore } from "../store";

/**
 * 권한을 이미 물어본 구간 — 거절당했을 때 1분마다 팝업이 다시 뜨지 않게 한다.
 * 모듈 스코프라 앱을 껐다 켜면 다시 한 번 물어본다.
 */
let permissionAskedFor: number | null = null;

/**
 * 자동 탑승 — 일정에 등록된 열차 **출발 시각이 되면** 탑승 세션을 열고,
 * **도착 시각이 지나면** 닫는다. '탑승 시작' 버튼을 누르지 않아도 된다.
 *
 * 세션은 화면용이다 — 일정표의 승차 ↔ 하차 사이에 풍경 시각표를 끼우고, 포그라운드로
 * 올라올 때 GPS 로 지연을 보정한다(useScenicCalibration). **풍경 푸시 자체는 서버가
 * 열차 시간표로 직접 보내므로** 세션이 없어도, 앱이 꺼져 있어도 알림은 온다.
 *
 * 화면이 아니라 앱 루트에 붙는 감시자다(렌더 결과 없음). 어느 탭을 보고 있든
 * 출발 시각이 되면 세션이 시작되고, 알림 탭의 풍경 카드가 그대로 이어받는다.
 * 출발 시각에 앱이 꺼져 있었다면 다음에 앱을 열었을 때 아직 도착 전이면 그때 시작된다.
 *
 * 사용자가 직접 '안내 끄기'를 누른 구간은 다시 켜지 않는다(store 의
 * skipAutoScheduleIdx). 도착 시각을 모르는 구간(end_time 없음)도 대상이 아니다.
 *
 * 알림 설정의 '기차역 풍경 알림'(scenery_alarm)을 켜 둔 사용자만 대상이다 — 꺼 둔
 * 기능의 시각표를 일정표에 끼우면 "끈 게 아니었나" 하게 된다. 탑승 중에 끄면 그 자리에서
 * 닫는다. 위치 권한은 **필수가 아니다** — 없으면 보정만 건너뛰고 예정 시각대로 안내한다.
 * (예전에는 세션 = GPS 폴링이라 위치 권한이 없으면 아예 열지 않았다.)
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

  /**
   * '기차역 풍경 알림'(알림 설정)을 켜 둔 사용자만 자동 탑승 대상이다.
   *
   * undefined 는 아직 조회 중이거나 조회에 실패했다는 뜻이라 "꺼짐"과 구분해서 다룬다 —
   * 시작 판단에서는 미확인을 켜짐으로 보지 않는다.
   */
  const { data: notificationSettings } = useNotificationSettingsQuery();
  const sceneryAlarm = notificationSettings?.scenery_alarm;

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
      // 탑승 중에 알림 설정에서 풍경 알림을 끈 경우. 여기서는 false 일 때만 끈다 —
      // undefined 로 끄면 네트워크가 잠깐 끊긴 사이 멀쩡한 세션이 죽는다.
      if (sceneryAlarm === false) {
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

    // 꺼져 있거나(false) 아직 모르면(undefined) 시작하지 않는다. 조회가 늦어져도
    // 값이 도착하면 이 이펙트가 다시 돌아 그때 시작되므로 한 번 놓치고 끝나지 않는다.
    if (sceneryAlarm !== true) return;
    if (!active) return;
    if (skipAutoScheduleIdx === active.scheduleIdx) return; // 사용자가 직접 종료한 구간
    if (permissionAskedFor === active.scheduleIdx) return; // 이미 물어보고 거절당함

    permissionAskedFor = active.scheduleIdx;
    void (async () => {
      // 위치 권한은 GPS 보정(지연 반영)에만 쓴다. 있으면 묻지 않고 통과, 없으면 여기서
      // 동의 창이 뜬다. 거절해도 세션은 연다 — 시각표와 알림은 예정 시각대로 동작하고,
      // 보정만 빠진다(calibrateNow 가 권한 없으면 조용히 건너뛴다).
      const granted = await ensureForegroundLocationPermission();
      // 허용됐으면 다음 구간도 정상 판단. 거절이면 남겨 두어 이 구간은 다시 묻지 않는다.
      if (granted) permissionAskedFor = null;

      // 동의 창을 오래 띄워두는 동안 상황이 바뀔 수 있다 — 구간이 끝났거나,
      // 여행이 종료됐거나, 사용자가 안내 끄기를 눌렀거나. 아래 travelIdx·active 는
      // 창이 뜨던 시점의 값이라 그대로 쓰면 이미 지난 구간으로 세션이 시작된다.
      // 그 사이 값이 하나라도 바뀌었으면 이 이펙트는 정리되고 새 값으로 다시 도니
      // 여기서는 조용히 빠지면 된다(다음 회차는 permissionAskedFor 가 막지 않는 한
      // 창 없이 통과).
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
    sceneryAlarm,
    skipAutoScheduleIdx,
    startRiding,
    stopRiding,
  ]);

  // 세션을 켜는 쪽이 GPS 보정도 책임진다 — 세션 시작 1회 + 포그라운드 복귀 1회.
  // 앱 루트에 항상 마운트돼 있어 어느 화면을 보든 한 곳에서만 나간다.
  // (세션이 없으면 훅이 알아서 쉰다)
  useScenicCalibration();

  return null;
}
