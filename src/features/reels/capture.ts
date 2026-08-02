import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Alert } from "react-native";

import { toReelsMediaAsset } from "./media";
import type { ReelsMediaAsset } from "./types";

/**
 * 카메라로 직접 촬영 → 현재 위치·시각까지 담은 ReelsMediaAsset[]. 취소/권한거부 시 null.
 *
 * 촬영 사진의 EXIF 에 GPS 가 없을 수 있어, 촬영 직후 기기 GPS(expo-location)로 위치를 받는다.
 */
export async function captureFromCamera(): Promise<ReelsMediaAsset[] | null> {
  const camPerm = await ImagePicker.requestCameraPermissionsAsync();
  if (!camPerm.granted) {
    Alert.alert("카메라 권한 필요", "설정에서 카메라 접근을 허용해 주세요.");
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images", "videos"],
    quality: 1,
    exif: true,
  });
  if (result.canceled) return null;

  // 현재 위치 — 권한 없거나 실패해도 촬영 자체는 유지
  let here: { latitude: number; longitude: number } | null = null;
  try {
    const locPerm = await Location.requestForegroundPermissionsAsync();
    if (locPerm.granted) {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      here = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    }
  } catch {
    // 위치 못 받아도 사진은 그대로 사용
  }

  const nowIso = new Date().toISOString();
  return result.assets.map((asset) => {
    const media = toReelsMediaAsset(asset);
    if (here) {
      media.latitude = here.latitude;
      media.longitude = here.longitude;
    }
    if (!media.taken_at) media.taken_at = nowIso; // EXIF 시각 없으면 촬영 시각으로
    return media;
  });
}

