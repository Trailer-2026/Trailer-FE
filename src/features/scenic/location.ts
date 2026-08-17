import * as Location from "expo-location";

/**
 * ⚠️ 개발용 임시 스위치 — 실제 GPS 대신 하드코딩 좌표를 쓴다.
 *
 * 실기기가 서울에 있어도 "지금 조치원 부근을 달리는 중"인 것처럼 흉내 내서
 * 풍경 알림(GET /api/scenic-spots/nearby)을 확인하기 위한 것. 켜면 위치 권한도
 * 묻지 않고 통과한다(기기 GPS 를 꺼둬도 됨).
 * 확인이 끝나면 false 로 되돌릴 것. (__DEV__ 라 릴리스 빌드에는 영향 없음)
 */
export const MOCK_LOCATION = __DEV__ && false;

/**
 * 어떤 노선을 흉내 낼지. MOCK_LOCATION 이 켜져 있을 때만 의미가 있다.
 *
 * - `"osong"` — 오송역 → 대전역. Swagger 예시 좌표라 **서버에 데이터가 있다고
 *   보장된 유일한 구간**이다. 세션의 역명까지 덮어쓴다. 목록 렌더·상태 전이처럼
 *   "UI 가 제대로 그려지는가"를 볼 때 쓴다.
 *
 * - `"gangneung"` / `"gorae"` — **역명을 덮어쓰지 않고 세션의 실제 값을 쓴다.**
 *   좌표만 목업이라 GPS 획득 실패는 우회하면서, 지금 여행의 진짜 구간으로 서버에
 *   질의한다. 여기서 0건이 나오면 그 구간에 서버 데이터가 없다는 뜻이다
 *   (좌표 문제가 아님 — 좌표는 노선 위에 있으므로).
 *   ⚠️ 좌표가 노선 위에 있어야 하므로 **지금 탑승 중인 구간과 짝을 맞춰 고를 것.**
 *
 * 에뮬레이터에서는 실제 GPS 를 못 쓴다 — `adb emu geo fix` 가 OK 를 반환해도
 * fix 가 provider 까지 도달하지 않아 getCurrentPositionAsync 가 계속 실패한다.
 * 실제 GPS 획득 검증은 실기기에서만 가능하다.
 */
const MOCK_ROUTE: "osong" | "gangneung" | "gorae" = "osong";

/**
 * 수동 모드 — 타이머가 알아서 좌표를 밀지 않고, 화면의 '다음 위치' 버튼을 누를 때만
 * 한 칸 전진한다. 자동(2초)으로 두면 눈으로 좇기 전에 노선을 지나쳐 버려서,
 * 한 지점씩 확인할 때는 이쪽이 편하다. MOCK_LOCATION 이 켜져 있을 때만 의미가 있다.
 */
export const MOCK_MANUAL = true;

/**
 * 노선별 목업 파라미터.
 *
 * `step` 은 좌표를 부를 때마다 더할 이동량(약 1km/틱).
 * ⚠️ **진행 방향을 도착역 쪽으로 맞출 것.** 서버가 "도착역 방위 ±100°" 밖의
 * 관광지를 잘라내므로, 도착역 반대쪽으로 밀면 결과가 계속 비어버린다.
 *
 * `stations` 가 null 이면 세션의 실제 역명을 그대로 쓴다.
 * **서버는 역명을 "오송역"처럼 `역` 접미사까지 붙여서 받는다**(Swagger 예시).
 * 앱의 여행 일정은 승차권에서 온 "강릉"·"묵호" 처럼 접미사가 없지만,
 * api.ts 의 normalizeStationName 이 요청 경계에서 붙여준다.
 */
const MOCK_ROUTES = {
  osong: {
    start: { lat: 36.59683, lng: 127.33874 },
    step: { lat: -0.0087, lng: 0.0031 },
    stations: { from: "오송역", to: "대전역" },
  },
  gangneung: {
    // 강릉역(37.7637, 128.8996) 조금 남쪽에서 출발해 묵호역(37.5486, 129.1129) 방향
    // 남동쪽으로 약 1km 씩. 30 틱쯤이면 묵호에 닿는다.
    start: { lat: 37.74, lng: 128.92 },
    step: { lat: -0.00717, lng: 0.00711 },
    stations: null,
  },
  gorae: {
    // 고래불(36.6178, 129.4197) → 강릉역(37.7637, 128.8996). 북서쪽으로 약 1km 씩.
    // 두 역 사이가 135km 라 135 틱(목업 2초 간격이면 4분 30초) 동안 노선 위에 머문다.
    start: { lat: 36.6178, lng: 129.4197 },
    step: { lat: 0.008488, lng: -0.003853 },
    stations: null,
  },
} as const;

const MOCK_START = MOCK_ROUTES[MOCK_ROUTE].start;
const MOCK_STEP = MOCK_ROUTES[MOCK_ROUTE].step;

/** 목업이 역명을 덮어쓸 때만 값이 있다. null 이면 세션의 실제 역명을 쓴다. */
export const MOCK_STATIONS: { from: string; to: string } | null = MOCK_LOCATION
  ? MOCK_ROUTES[MOCK_ROUTE].stations
  : null;

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
