import { File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import piexif from "piexifjs";

import type { ReelsMediaAsset } from "@/src/features/reels/types";

/** multipart 파일 파트로 넣을 준비가 끝난 사진. */
export type UploadFile = { uri: string; name: string; type: string };

/** 긴 변 최대 px. 원본이 이보다 크면 다운스케일(작으면 그대로). */
const MAX_EDGE = 2048;
/** JPEG 재인코딩 품질(0~1). 0.7 이면 장당 대개 수백 KB. */
const JPEG_QUALITY = 0.7;

/**
 * 렌더 업로드용으로 사진을 리사이즈·압축한다. HTTP 413(본문 초과) 회피가 목적.
 *
 * expo-image-manipulator 는 재인코딩 시 EXIF 를 전부 버리는데, 백엔드는 사진 파일
 * EXIF 에서 GPS 를 읽는다. 그래서 앱이 이미 갖고 있는 좌표·촬영시각을
 * piexifjs 로 다시 써넣는다(좌표가 있는 사진만 — 없던 사진은 넣을 값도 없다).
 */
export async function preparePhotoForUpload(
  asset: ReelsMediaAsset,
  index: number,
): Promise<UploadFile> {
  // 1) 다운스케일(필요 시) + JPEG 재인코딩 → base64 (이 시점에 EXIF 는 사라짐)
  const context = ImageManipulator.manipulate(asset.uri);
  const longest = Math.max(asset.width ?? 0, asset.height ?? 0);
  if (longest > MAX_EDGE) {
    const landscape = (asset.width ?? 0) >= (asset.height ?? 0);
    context.resize(landscape ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
    base64: true,
  });
  // 네이티브 이미지 메모리 즉시 해제(대량 사진 처리 시 누수 방지)
  rendered.release();

  let base64 = result.base64;
  if (!base64) throw new Error("이미지 인코딩에 실패했어요.");

  // 2) GPS/촬영시각 EXIF 재주입 (좌표가 있는 사진만)
  if (asset.latitude != null && asset.longitude != null) {
    base64 = injectExif(base64, asset.latitude, asset.longitude, asset.taken_at);
  }

  // 3) 임시 파일로 저장 → 업로드용 file:// uri
  const uri = writeBase64Jpeg(base64, index);
  return {
    uri,
    name: asset.file_name ?? `photo_${index}.jpg`,
    type: "image/jpeg",
  };
}

/** 리사이즈된 JPEG(base64)에 GPS/촬영시각 EXIF 를 삽입해 새 base64 를 돌려준다. */
function injectExif(
  base64Jpeg: string,
  lat: number,
  lng: number,
  takenAt: string | null,
): string {
  const dataUri = `data:image/jpeg;base64,${base64Jpeg}`;

  const gps: Record<number, unknown> = {
    [piexif.GPSIFD.GPSLatitudeRef]: lat >= 0 ? "N" : "S",
    [piexif.GPSIFD.GPSLatitude]: piexif.GPSHelper.degToDmsRational(Math.abs(lat)),
    [piexif.GPSIFD.GPSLongitudeRef]: lng >= 0 ? "E" : "W",
    [piexif.GPSIFD.GPSLongitude]: piexif.GPSHelper.degToDmsRational(Math.abs(lng)),
  };

  const zeroth: Record<number, unknown> = {};
  const exif: Record<number, unknown> = {};
  const dt = formatExifDateTime(takenAt);
  if (dt) {
    // 백엔드가 촬영시각순으로 정렬하므로 시각도 함께 복원한다.
    zeroth[piexif.ImageIFD.DateTime] = dt;
    exif[piexif.ExifIFD.DateTimeOriginal] = dt;
    exif[piexif.ExifIFD.DateTimeDigitized] = dt;
  }

  const exifStr = piexif.dump({ "0th": zeroth, Exif: exif, GPS: gps });
  const inserted = piexif.insert(exifStr, dataUri);
  return inserted.replace(/^data:image\/jpeg;base64,/, "");
}

/** ISO 8601 → EXIF 형식 "YYYY:MM:DD HH:MM:SS"(로컬 시각 기준). */
function formatExifDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}:${p(d.getMonth() + 1)}:${p(d.getDate())} ` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  );
}

/** base64 JPEG 를 캐시 디렉터리에 저장하고 file:// uri 반환. */
function writeBase64Jpeg(base64: string, index: number): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const file = new File(Paths.cache, `reels_upload_${index}.jpg`);
  if (file.exists) file.delete(); // 재시도 시 이전 파일 덮어쓰기
  file.create();
  file.write(bytes);
  return file.uri;
}
