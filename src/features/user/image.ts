import * as ImagePicker from "expo-image-picker";

import type { ProfileImageFile } from "./types";

/**
 * 갤러리에서 프로필 사진 1장을 고른다. 취소하면 null.
 *
 * - 안드로이드 시스템 포토 피커를 쓰므로 별도 미디어 권한 요청이 필요 없다.
 * - 아바타가 원형이라 정사각(1:1)으로 크롭받고, 용량을 줄이려 quality 0.8 로 압축한다.
 *   (서버가 10MB 초과를 400 으로 막지만, 애초에 큰 원본을 올리지 않는 게 낫다.)
 */
export async function pickProfileImage(): Promise<ProfileImageFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  const name = asset.fileName ?? asset.uri.split("/").pop() ?? "profile.jpg";
  const type = asset.mimeType ?? "image/jpeg";
  return { uri: asset.uri, name, type };
}
