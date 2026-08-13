import type { ImagePickerAsset } from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import type { AssetInfo } from "expo-media-library";

import type { ReelsMediaAsset } from "./types";

/** 사진 1장이 영상에서 차지하는 길이(초). 타임라인 눈금·총 길이 계산에 사용. */
export const SECONDS_PER_PHOTO = 2;

/**
 * EXIF 날짜는 "2024:05:03 12:33:21" 형식이라 Date 가 그대로 파싱하지 못한다.
 * 앞의 날짜 구분자만 '-' 로 바꿔 ISO 로 만든다. 타임존 정보는 EXIF 에 없어 로컬 시각으로 취급.
 */
function parseExifDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = value.match(
    /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/,
  );
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * EXIF GPS 좌표.
 * - 안드로이드: GPSLatitude 가 이미 십진수(number), 남/서반구면 GPSLatitudeRef 가 'S'/'W'.
 * - iOS: 중첩된 GPS 객체로 오는 경우가 있어 두 위치를 모두 본다.
 */
function parseExifCoord(
  exif: Record<string, unknown> | null | undefined,
  key: "GPSLatitude" | "GPSLongitude",
  refKey: "GPSLatitudeRef" | "GPSLongitudeRef",
): number | null {
  if (!exif) return null;
  const nested = exif.GPS as Record<string, unknown> | undefined;
  const raw = exif[key] ?? nested?.[key];
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(value)) return null;

  const ref = (exif[refKey] ?? nested?.[refKey]) as string | undefined;
  const negative = ref === "S" || ref === "W";
  return negative ? -Math.abs(value) : value;
}

/** 갤러리에서 받은 원본 asset → 앱에서 쓰는 형태로 변환 (EXIF 메타데이터 추출 포함). */
export function toReelsMediaAsset(asset: ImagePickerAsset): ReelsMediaAsset {
  const exif = asset.exif as Record<string, unknown> | null | undefined;

  return {
    uri: asset.uri,
    kind: asset.type === "video" ? "video" : "image",
    width: asset.width,
    height: asset.height,
    duration: asset.duration ?? null,
    file_name: asset.fileName ?? null,
    taken_at:
      parseExifDate(exif?.DateTimeOriginal) ?? parseExifDate(exif?.DateTime),
    latitude: parseExifCoord(exif, "GPSLatitude", "GPSLatitudeRef"),
    longitude: parseExifCoord(exif, "GPSLongitude", "GPSLongitudeRef"),
  };
}

/**
 * 시스템 피커가 지운 촬영 위치·시각을 원본 asset 에서 되찾는다.
 *
 * 안드로이드 13+ Photo Picker 는 사진 사본을 넘기면서 EXIF GPS 를 지운다.
 * 서버는 사진 GPS 로 일정을 매핑하므로 좌표가 사라지면 일정 연결이 끊긴다.
 * assetId 로 MediaLibrary 원본을 다시 조회해 좌표를 채운다
 * (ACCESS_MEDIA_LOCATION 권한은 app.config.ts 에서 켜져 있다).
 *
 * 권한 거부·조회 실패는 좌표 없이 그대로 진행한다 — 기기 현재 위치로
 * 대체하지 않는다. 갤러리 사진은 지금 여기서 찍힌 사진이 아니다.
 */
export async function fillLocationFromLibrary(
  asset: ImagePickerAsset,
): Promise<ReelsMediaAsset> {
  const media = toReelsMediaAsset(asset);
  if (media.latitude != null || !asset.assetId) return media;

  try {
    const perm = await MediaLibrary.getPermissionsAsync();
    if (!perm.granted && !(await MediaLibrary.requestPermissionsAsync()).granted) {
      return media;
    }
    const info = await MediaLibrary.getAssetInfoAsync(asset.assetId);
    if (info.location) {
      media.latitude = info.location.latitude;
      media.longitude = info.location.longitude;
    }
    if (!media.taken_at && info.creationTime) {
      media.taken_at = new Date(info.creationTime).toISOString();
    }
  } catch {
    // 원본 조회 실패 — 좌표 없이 사용
  }
  return media;
}

/**
 * MediaLibrary AssetInfo → 앱 타입.
 *
 * 커스텀 갤러리 그리드에서 고른 사진은 이 경로로 변환한다. 시스템 피커와 달리
 * 원본 asset 을 직접 읽으므로 location(위치)·creationTime(촬영시각)이 그대로 들어온다.
 */
export function toReelsMediaFromLibrary(info: AssetInfo): ReelsMediaAsset {
  const isVideo = info.mediaType === "video";
  return {
    // localUri(file://)가 있으면 그걸 쓴다 — 업로드·미리보기에 바로 사용 가능
    uri: info.localUri ?? info.uri,
    kind: isVideo ? "video" : "image",
    width: info.width,
    height: info.height,
    // MediaLibrary duration 은 초 단위 → ms 로 통일
    duration: isVideo ? Math.round(info.duration * 1000) : null,
    file_name: info.filename ?? null,
    // creationTime 은 epoch ms — EXIF 파싱 없이 촬영시각을 바로 얻는다
    taken_at: info.creationTime
      ? new Date(info.creationTime).toISOString()
      : null,
    latitude: info.location?.latitude ?? null,
    longitude: info.location?.longitude ?? null,
  };
}

/** 초 → "0:07" / "1:03" 형태. 미리보기 재생바·타임라인 눈금 공용. */
export function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** 타임라인 눈금용 "00:04" (분:초 2자리). */
export function formatTimelineLabel(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 미디어 목록의 총 재생 길이(초). 영상은 실제 길이, 사진은 SECONDS_PER_PHOTO. */
export function totalDurationSeconds(assets: ReelsMediaAsset[]) {
  return assets.reduce(
    (sum, a) =>
      sum + (a.kind === "video" && a.duration ? a.duration / 1000 : SECONDS_PER_PHOTO),
    0,
  );
}
