import * as Location from "expo-location";

/**
 * 포그라운드 위치 권한 확보. 이미 허용돼 있으면 요청 없이 true.
 * 백그라운드 위치는 이번 범위 밖 — 앱이 화면에 떠 있을 때만 폴링한다.
 */
export async function ensureForegroundLocationPermission(): Promise<boolean> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.granted) return true;
    const asked = await Location.requestForegroundPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

/** 현재 좌표. 권한이 없거나 실패하면 null. */
export async function getCurrentLatLng(): Promise<{
  lat: number;
  lng: number;
} | null> {
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}
