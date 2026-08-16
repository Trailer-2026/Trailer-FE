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
  /**
   * 좌표가 없는 사진을 막을지. 붙일 일정(schedule_idx)을 이미 아는 경우엔
   * 서버가 GPS 로 일정을 찾을 필요가 없어 false 로 부른다.
   */
  { requireLocation = true }: { requireLocation?: boolean } = {},
): Promise<ReelsMediaAsset | null> {
  const photo =
    source === "camera" ? await shootPhoto() : await pickFromLibrary();
  if (!photo) return null;

  // 붙일 일정을 모르는데 좌표까지 없으면 서버가 매핑할 방법이 없어 아예 받지 않는다.
  // (스크린샷·다운로드 사진, 위치 기록을 끄고 찍은 사진, 위치 권한을 거부한 촬영)
  //
  // 두 경로가 반드시 같은 검사를 거치도록 분기 바깥에 둔다 — 예전에는 촬영 경로가
  // 곧바로 return 해 이 검사를 건너뛰었고, 좌표 없는 사진이 어느 일정에도 붙지 않은
  // 채 업로드됐다(captureFromCamera 는 위치를 못 받아도 사진을 그대로 돌려준다).
  if (requireLocation && (photo.latitude == null || photo.longitude == null)) {
    Alert.alert(
      "위치 정보가 없는 사진이에요",
      source === "camera"
        ? "여행 일정에 붙이려면 촬영 위치가 필요해요. 설정에서 위치 접근을 허용한 뒤 다시 찍어주세요."
        : "여행 일정에 붙이려면 촬영 위치가 기록된 사진이어야 해요. 다른 사진을 골라주세요.",
    );
    return null;
  }
  return photo;
}

/** 촬영 — 사진만 쓴다(영상이 섞여 오면 버린다). 위치는 captureFromCamera 가 채운다. */
async function shootPhoto(): Promise<ReelsMediaAsset | null> {
  const media = await captureFromCamera();
  return media?.find((m) => m.kind === "image") ?? null;
}

async function pickFromLibrary(): Promise<ReelsMediaAsset | null> {
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
  return fillLocationFromLibrary(result.assets[0]);
}
