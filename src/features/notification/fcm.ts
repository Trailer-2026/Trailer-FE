import { getApp } from "@react-native-firebase/app";
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  onTokenRefresh,
  requestPermission as requestFirebasePermission,
} from "@react-native-firebase/messaging";
import { PermissionsAndroid, Platform } from "react-native";

import { api } from "@/src/api/client";

/**
 * FCM(푸시 알림) 핵심 로직.
 * - 안드로이드 전용. iOS/web은 고려하지 않는다.
 * - 모든 함수는 실패해도 앱 흐름을 막지 않도록 조용히 처리하고 로그만 남긴다.
 */

const FCM_TOKEN_ENDPOINT = "/api/fcm/token";

// 앱 세션 동안 마지막으로 서버에 등록한 토큰. 같은 토큰의 반복 등록(로그인 여러 번 등)을
// 건너뛰기 위한 캐시. 앱 재시작 시 초기화되므로 재실행마다 최소 1회는 등록된다.
let lastRegisteredToken: string | null = null;

/** 서버에 토큰 등록 (백엔드가 upsert 처리 → 중복 전송 안전). access token 인증 필요. */
async function postToken(token: string): Promise<void> {
  // 기존 axios client 사용 → 요청 인터셉터가 Authorization: Bearer 자동 첨부
  await api.post(FCM_TOKEN_ENDPOINT, { token });
  lastRegisteredToken = token;
}

/**
 * 알림 권한 요청.
 * - Android 13(API 33)+ 는 POST_NOTIFICATIONS 런타임 권한이 실제 게이트다.
 * - 권한 거부 시 조용히 false 반환(앱은 계속 동작).
 */
export async function requestPermission(): Promise<boolean> {
  try {
    // Android 13+ 런타임 알림 권한
    if (Platform.OS === "android" && Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log("[fcm] POST_NOTIFICATIONS 권한 거부됨:", result);
        return false;
      }
    }

    // Firebase 레벨 권한 상태 확인 (구버전/크로스플랫폼 대비)
    const authStatus = await requestFirebasePermission(getMessaging(getApp()));
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (!enabled) console.log("[fcm] 알림 권한 미허용:", authStatus);
    return enabled;
  } catch (e) {
    console.log("[fcm] 권한 요청 실패:", e);
    return false;
  }
}

/** FCM 기기 토큰 문자열 반환. 실패 시 null. */
export async function getFcmToken(): Promise<string | null> {
  try {
    const token = await getToken(getMessaging(getApp()));
    return token || null;
  } catch (e) {
    console.log("[fcm] getToken 실패:", e);
    return null;
  }
}

/**
 * 현재 기기 토큰을 서버에 등록.
 * 반드시 로그인(access token 저장) 이후에 호출할 것.
 * 실패해도 앱 흐름을 막지 않는다.
 */
export async function registerFcmToken(): Promise<void> {
  try {
    const token = await getFcmToken();
    if (!token) return;
    // 같은 토큰이면 이미 등록됨 → 재전송 생략.
    if (token === lastRegisteredToken) return;
    await postToken(token);
  } catch (e) {
    console.log("[fcm] 토큰 등록 실패:", e);
  }
}

/**
 * 토큰 갱신 구독. FCM 토큰이 재발급되면 서버에 다시 등록한다.
 * @returns 구독 해제 함수
 */
export function setupTokenRefresh(): () => void {
  return onTokenRefresh(getMessaging(getApp()), async (token) => {
    if (token === lastRegisteredToken) return;
    try {
      await postToken(token);
      console.log("[fcm] 갱신 토큰 재등록 완료");
    } catch (e) {
      console.log("[fcm] 갱신 토큰 등록 실패:", e);
    }
  });
}

/**
 * 로그인 성공 직후 호출: 권한 요청 → 토큰 서버 등록.
 * 카카오/구글 공통 경로에서 사용. 내부에서 모든 오류를 삼키므로 await/무시 모두 안전.
 */
export async function syncFcmToken(): Promise<void> {
  await requestPermission();
  await registerFcmToken();
}
