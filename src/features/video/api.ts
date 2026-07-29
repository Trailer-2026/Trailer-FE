import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type { ReelsMediaAsset } from "@/src/features/reels/types";
import type { RenderOptions, VideoRenderStatusResponse } from "./types";

/** file_name 확장자로 multipart MIME 을 추정한다. 못 찾으면 image/jpeg. */
function mimeFromName(name: string | null): string {
  const ext = name?.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
    case "heif":
      return "image/heic";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

/**
 * 사진→영상 렌더 시작. POST /api/videos/render/photos-only (multipart/form-data).
 *
 * - photos: 각 사진을 { uri, name, type } 파일 파트로 "photos" 필드에 여러 개 append.
 *   순서는 백엔드가 EXIF 촬영시각으로 재정렬하므로 프론트 순서를 강제하지 않는다.
 * - 텍스트 옵션(engine/theme/light_preset/intro/outro/quick/bgm)은 문자열로 append.
 *   boolean 은 "true"/"false" 로 직렬화.
 * - Content-Type 은 지정하지 않는다 — RN 의 XHR 이 FormData 를 감지해
 *   multipart/form-data 와 boundary 를 자동으로 붙인다(직접 손대면 boundary 누락).
 * - 여러 원본 사진 업로드가 전역 10s 를 넘길 수 있어 timeout 을 60s 로 override.
 *
 * 응답: job_id 즉시 반환(status=running). 이후 getRenderStatus 로 폴링.
 * 400: 사진 2장 미만 / GPS 있는 사진 2장 미만 / 모두 같은 장소 / 알 수 없는
 *      engine·theme·light_preset 등 → 서버 message 를 그대로 사용자에게 노출.
 */
export async function renderPhotosOnly(
  photos: ReelsMediaAsset[],
  options: RenderOptions,
): Promise<VideoRenderStatusResponse> {
  const form = new FormData();

  photos.forEach((photo, index) => {
    form.append("photos", {
      uri: photo.uri,
      name: photo.file_name ?? `photo_${index}.jpg`,
      type: mimeFromName(photo.file_name),
    } as unknown as Blob);
  });

  form.append("engine", options.engine);
  form.append("theme", options.theme);
  form.append("light_preset", options.light_preset);
  form.append("intro", String(options.intro));
  form.append("outro", String(options.outro));
  form.append("quick", String(options.quick));
  form.append("bgm", options.bgm);
  // TODO(향후): 출발지 지정 시 start_name/start_latitude/start_longitude append.

  const res = await api.post<CommonResponse<VideoRenderStatusResponse>>(
    "/api/videos/render/photos-only",
    form,
    { timeout: 60000 },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * 렌더 진행률 조회. GET /api/videos/render/{job_id}.
 * 좌표 입력 렌더(POST /api/videos/render)도 동일 응답을 쓰므로 공용으로 재사용한다.
 * 404: 존재하지 않는 job_id(서버 재시작으로 메모리에서 사라졌을 수 있음)
 *      → 호출부(queries.ts)에서 재시도 없이 표면화.
 */
export async function getRenderStatus(
  jobId: string,
): Promise<VideoRenderStatusResponse> {
  const res = await api.get<CommonResponse<VideoRenderStatusResponse>>(
    `/api/videos/render/${jobId}`,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
