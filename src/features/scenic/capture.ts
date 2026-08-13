import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

import { captureFromCamera } from "@/src/features/reels/capture";
import { toReelsMediaAsset } from "@/src/features/reels/media";
import type { ReelsMediaAsset } from "@/src/features/reels/types";
import type { MediaSource } from "@/src/features/reels/components/MediaSourceSheet";

/**
 * 창밖 풍경 사진 1장 고르기 — 촬영 또는 갤러리.
 *
 * 영상 만들기와 달리 사진 1장만 다루고, 서버에 등록할 값(좌표·촬영시각)이 필요해
 * 카메라 경로는 GPS 를 함께 담는 기존 captureFromCamera 를 그대로 쓴다.
 * 취소하거나 권한을 거부하면 null.
 */
export async function pickScenicPhoto(
  source: MediaSource,
): Promise<ReelsMediaAsset | null> {
  if (source === "camera") {
    const media = await captureFromCamera();
    // 촬영은 사진만 쓴다 — 영상이 섞여 오면 버린다.
    return media?.find((m) => m.kind === "image") ?? null;
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("사진 권한 필요", "설정에서 사진 접근을 허용해 주세요.");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
    exif: true,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return toReelsMediaAsset(result.assets[0]);
}
