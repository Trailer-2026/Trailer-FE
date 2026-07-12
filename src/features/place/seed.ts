import type { ThemedPlacesResponse } from "./types";

/**
 * NATURE(홈 기본 테마) 프리시드 스냅샷.
 *
 * 홈 진입 즉시 스피너 없이 화면을 채우기 위한 정적 데이터.
 * useThemedPlaces 가 이 값을 initialData 로 주입하므로 첫 페인트에 바로 보이고,
 * 실제 TourAPI 응답(실시간이라 다소 느림)은 마운트 직후 백그라운드 refetch 로 조용히 교체된다.
 *
 * image_url / banner_image_url 은 null → 컴포넌트가 번들 이미지(Main.png)로 폴백.
 * (원격 이미지 URL 은 시간이 지나면 만료될 수 있어 하드코딩하지 않는다.)
 */
export const NATURE_SEED: ThemedPlacesResponse = {
  theme: "NATURE",
  title: "아름다운 숲과 자연의 도시",
  banner_image_url: null,
  places: [
    { name: "하늬 라벤더팜", region: "강원도 고성군", image_url: null },
    { name: "천학정", region: "강원도 고성군", image_url: null },
    { name: "화암사", region: "강원도 고성군", image_url: null },
  ],
};
