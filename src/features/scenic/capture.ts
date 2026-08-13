import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

import { captureFromCamera } from "@/src/features/reels/capture";
import { fillLocationFromLibrary } from "@/src/features/reels/media";
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

  // 시스템 피커가 지운 GPS 를 원본 asset 에서 되찾는다(서버가 좌표로 일정에 매핑).
  const photo = await fillLocationFromLibrary(result.assets[0]);
  if (photo.latitude == null && !(await confirmNoLocation())) return null;
  return photo;
}

/**
 * 좌표가 없는 사진은 일정에 자동 연결되지 않는다 — 그대로 올릴지 먼저 묻는다.
 * (스크린샷·다운로드 사진처럼 원본에도 위치가 없는 경우)
 */
function confirmNoLocation(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      "위치 정보가 없는 사진이에요",
      "이 사진은 여행 일정에 자동으로 연결되지 않고 여행에만 등록돼요. 계속할까요?",
      [
        { text: "취소", style: "cancel", onPress: () => resolve(false) },
        { text: "계속", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
