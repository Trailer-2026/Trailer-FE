import { useEffect } from "react";

import { useConfirmDialog } from "@/src/components/ConfirmDialog";
import { useNotificationSettingsQuery } from "@/src/features/notification/queries";

import {
  ensureForegroundLocationPermission,
  hasForegroundLocationPermission,
} from "../location";

/**
 * 앱 실행당 1회만 묻는다. '나중에' 를 눌렀다고 화면을 드나들 때마다 다시 띄우면
 * 성가시고, 안드로이드는 시스템 창을 두 번 거절당하면 다시 물어볼 수 없다.
 */
let promptedThisRun = false;

/**
 * 일정표 상세에 들어왔을 때 위치 권한을 미리 받아두는 안내.
 *
 * 이게 없으면 사용자가 권한 창을 처음 보는 순간이 **열차 출발 시각**이 된다
 * (AutoBoarding 이 자동 탑승하면서 요청). 맥락 없이 뜨는 시스템 창은 거절률이
 * 높고, 안드로이드는 두 번 거절하면 앱에서 다시 물어볼 수 없다. 그래서 여행
 * 일정을 여는 시점에 "왜 필요한지"를 앱 UI 로 먼저 설명하고 요청한다.
 *
 * 이미 허용돼 있으면 아무것도 하지 않는다. 목업 위치 모드(MOCK_LOCATION)에서도
 * 권한 확인이 항상 true 라 뜨지 않는다 — 실제 동작을 보려면 목업을 꺼야 한다.
 *
 * 알림 설정에서 '기차역 풍경 알림'을 꺼 둔 사용자에게는 묻지 않는다. 이 창의 명분이
 * 풍경 알림 하나뿐이라, 꺼 둔 기능을 위해 위치 권한을 요구하는 꼴이 된다.
 */
export default function LocationPermissionPrompt() {
  const { dialog, ask, notify } = useConfirmDialog();
  const { data: notificationSettings } = useNotificationSettingsQuery();
  const sceneryAlarm = notificationSettings?.scenery_alarm;

  useEffect(() => {
    // 아직 조회 중이면(undefined) 미룬다 — 값이 도착하면 이 이펙트가 다시 돈다.
    if (sceneryAlarm !== true) return;
    if (promptedThisRun) return;
    promptedThisRun = true;

    void (async () => {
      if (await hasForegroundLocationPermission()) return;
      ask({
        title: "위치 권한을 허용해 주세요",
        message:
          "열차를 타는 동안 창밖으로 보이는 관광지를 실시간으로 알려드리려면 위치 권한이 필요해요. 여행 중에만 사용해요.",
        confirmLabel: "권한 허용",
        cancelLabel: "나중에",
        onConfirm: async () => {
          const granted = await ensureForegroundLocationPermission();
          if (granted) return;
          notify({
            title: "권한이 꺼져 있어요",
            message:
              "설정 > 앱 > 권한 > 위치에서 허용하면 열차 안에서 풍경 알림을 받을 수 있어요.",
          });
        },
      });
    })();
  }, [ask, notify, sceneryAlarm]);

  return dialog;
}
