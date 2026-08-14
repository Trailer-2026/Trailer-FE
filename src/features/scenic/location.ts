import * as Location from "expo-location";

/**
 * ⚠️ 개발용 임시 스위치 — 실제 GPS 대신 하드코딩 좌표를 쓴다.
 *
 * 실기기가 서울에 있어도 "지금 조치원 부근을 달리는 중"인 것처럼 흉내 내서
 * 풍경 알림(GET /api/scenic-spots/nearby)을 확인하기 위한 것. 켜면 위치 권한도
 * 묻지 않고 통과한다(기기 GPS 를 꺼둬도 됨).
 * 확인이 끝나면 false 로 되돌릴 것. (__DEV__ 라 릴리스 빌드에는 영향 없음)
 */
export const MOCK_LOCATION = __DEV__ && true;

/**
 * 목업 시작 좌표 — Swagger 의 예시 좌표(오송역 부근) 그대로.
 * 서버가 "여기서 오송역→대전역이면 결과가 나온다"고 문서에 박아둔 지점이라
 * 데이터가 있다고 믿을 수 있는 유일한 좌표다. 함부로 바꾸면 0건의 원인이
 * 좌표인지 로직인지 구분할 수 없게 된다.
 */
const MOCK_START = { lat: 36.59683, lng: 127.33874 };

/**
 * 목업 구간. **서버는 역명을 "오송역"처럼 `역` 접미사까지 붙여서 받는다**(Swagger 예시).
 * 반면 앱의 여행 일정은 승차권에서 온 "서울"·"부산" 처럼 접미사 없는 이름을 들고
 * 있어서, 세션 값을 그대로 보내면 구간 매칭이 실패해 items 가 계속 빈 배열로 온다.
 * 그래서 목업 모드에선 역명도 세션 대신 이 값으로 덮어쓴다.
 */
export const MOCK_STATIONS = { from: "오송역", to: "대전역" };

/**
 * 좌표를 부를 때마다 더할 이동량. 오송역 → 대전역 방위(남동쪽)로 약 1km.
 *
 * ⚠️ **진행 방향을 도착역 쪽으로 맞출 것.** 서버가 "도착역 방위 ±100°" 밖의
 * 관광지를 잘라내므로, 도착역 반대쪽으로 밀면 결과가 계속 비어버린다.
 *
 * 미이동 스킵 임계값을 넘겨야 실제 호출이 나가지만(목업 모드에선 0 이라 무관),
 * 둘 다 0 으로 두면 제자리 정차 상태를 확인할 수 있다.
 */
const MOCK_STEP = { lat: -0.0087, lng: 0.0031 };

/** getCurrentLatLng 호출 횟수 — 목업 좌표를 한 칸씩 밀어주는 용도. */
let mockTicks = 0;

/** 목업 좌표를 시작 지점으로 되돌린다. 탑승 시작 때 호출. */
export function resetMockLocation() {
  mockTicks = 0;
}

/**
 * 포그라운드 위치 권한 확보. 이미 허용돼 있으면 요청 없이 true.
 * 백그라운드 위치는 이번 범위 밖 — 앱이 화면에 떠 있을 때만 폴링한다.
 */
export async function ensureForegroundLocationPermission(): Promise<boolean> {
  if (MOCK_LOCATION) return true; // 목업 좌표를 쓰므로 기기 권한이 필요 없다.
  try {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.granted) return true;
    const asked = await Location.requestForegroundPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

/**
 * 지금 권한이 있는지만 확인한다 — **요청 창을 띄우지 않는다.**
 * 알림 탭의 "실제 위치 켜기" 버튼이 이미 켜진 상태인지 그리려고 쓴다.
 */
export async function hasForegroundLocationPermission(): Promise<boolean> {
  if (MOCK_LOCATION) return true;
  try {
    const current = await Location.getForegroundPermissionsAsync();
    return current.granted;
  } catch {
    return false;
  }
}

/** 현재 좌표. 권한이 없거나 실패하면 null. */
export async function getCurrentLatLng(): Promise<{
  lat: number;
  lng: number;
} | null> {
  if (MOCK_LOCATION) {
    const here = {
      lat: MOCK_START.lat + MOCK_STEP.lat * mockTicks,
      lng: MOCK_START.lng + MOCK_STEP.lng * mockTicks,
    };
    mockTicks += 1;
    console.log("[scenic] MOCK 위치", here.lat.toFixed(5), here.lng.toFixed(5));
    return here;
  }
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}
