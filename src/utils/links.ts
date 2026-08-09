import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";

/** 코레일 내일로 패스 소개·예약 페이지. */
export const NAEILRO_PASS_URL =
  "https://www.korail.com/tour/freeTravel/railro/passIntro";

/**
 * 외부 웹 링크 열기.
 *
 * Linking.openURL(외부 브라우저 앱으로 이탈) 대신 expo-web-browser 를 쓴다.
 * 안드로이드 Chrome Custom Tabs 로 앱 위에 웹뷰가 떠서, 닫으면 보던 화면으로
 * 그대로 돌아온다(앱이 백그라운드로 밀리지 않음).
 *
 * onPress 에 그대로 넘길 수 있도록 Promise 가 아닌 void 를 반환한다.
 */
export function openExternalUrl(url: string): void {
  WebBrowser.openBrowserAsync(url).catch(() => {
    Alert.alert("페이지를 열 수 없어요", "잠시 후 다시 시도해 주세요.");
  });
}
