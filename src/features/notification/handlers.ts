import { getApp } from "@react-native-firebase/app";
import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
} from "@react-native-firebase/messaging";

/**
 * FCM 메시지 수신 처리 핸들러 모음.
 * 지금은 콘솔 로그 + 라우팅/인앱표시 자리(TODO)만 잡은 골격 단계.
 */

/**
 * 포그라운드(앱이 화면에 켜져 있는 상태) 메시지 수신.
 * Android는 포그라운드일 때 시스템 알림이 자동으로 뜨지 않으므로,
 * 필요하면 여기서 인앱 배너/토스트를 직접 띄운다.
 * @returns 구독 해제 함수
 */
export function setupForegroundHandler(): () => void {
  return onMessage(getMessaging(getApp()), async (remoteMessage) => {
    console.log("[fcm] 포그라운드 수신:", JSON.stringify(remoteMessage));
    // TODO: 인앱 알림 배너/토스트 표시 (notifee 등으로 추후 확장)
  });
}

/**
 * 알림을 탭해서 앱을 열었을 때의 처리.
 * - onNotificationOpenedApp: 백그라운드(앱은 살아있음) 상태에서 알림 탭
 * - getInitialNotification: 앱이 완전히 종료된 상태에서 알림 탭으로 실행
 * @returns 구독 해제 함수 (onNotificationOpenedApp 구독 해제)
 */
export function setupNotificationOpenHandlers(): () => void {
  const messaging = getMessaging(getApp());

  // 백그라운드 상태에서 알림 탭 → 앱 포그라운드로
  const unsubscribe = onNotificationOpenedApp(messaging, (remoteMessage) => {
    console.log(
      "[fcm] 백그라운드에서 알림 탭:",
      JSON.stringify(remoteMessage),
    );
    // TODO: remoteMessage.data 기반으로 해당 화면으로 라우팅 이동
    //   예) if (remoteMessage?.data?.screen) router.push(...)
  });

  // 종료 상태에서 알림 탭 → 앱 실행 (실행 시 1회 확인)
  getInitialNotification(messaging).then((remoteMessage) => {
    if (!remoteMessage) return;
    console.log(
      "[fcm] 종료 상태에서 알림 탭으로 실행:",
      JSON.stringify(remoteMessage),
    );
    // TODO: remoteMessage.data 기반으로 초기 라우팅 이동
  });

  return unsubscribe;
}

/**
 * 백그라운드/종료 상태 데이터 메시지 처리가 필요할 때 사용.
 *
 * ⚠️ setBackgroundMessageHandler 는 반드시 **앱 진입점의 모듈 스코프**
 *    (컴포넌트 바깥, import 직후 최상단)에서 등록해야 한다.
 *    Expo Router에서는 app/_layout.tsx 상단(모듈 스코프)이 그 위치다.
 *
 * 사용 예 — app/_layout.tsx 최상단에서:
 *   import { getApp } from "@react-native-firebase/app";
 *   import { getMessaging, setBackgroundMessageHandler } from "@react-native-firebase/messaging";
 *   setBackgroundMessageHandler(getMessaging(getApp()), async (remoteMessage) => {
 *     console.log("[fcm] 백그라운드 데이터 메시지:", remoteMessage);
 *   });
 *
 * 현재는 알림(notification) 페이로드만 사용하므로 별도 등록하지 않는다.
 */
