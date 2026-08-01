import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type { ReelsMediaAsset } from "@/src/features/reels/types";
import { preparePhotoForUpload } from "./photo-upload";
import type {
  BgmTrackResponse,
  RenderOptions,
  VideoRenderStatusResponse,
} from "./types";

/**
 * 영상에 입힐 수 있는 BGM 트랙 목록. GET /api/videos/bgm.
 * (경로는 추정 — 실제와 다르면 여기만 수정) file 값을 렌더 요청 bgm 으로 그대로 쓴다.
 */
export async function getBgmTracks(): Promise<BgmTrackResponse[]> {
  const res = await api.get<CommonResponse<BgmTrackResponse[]>>(
    "/api/videos/bgm",
  );
  return res.data.data ?? [];
}

/**
 * 사진→영상 렌더 시작. POST /api/videos/render/photos-only (multipart/form-data).
 *
 * - photos: 업로드 전 각 사진을 리사이즈·압축한다(preparePhotoForUpload) — 원본을 그대로
 *   올리면 본문이 커져 413 이 난다. 리사이즈로 사라진 EXIF GPS·촬영시각은 앱이 가진
 *   좌표로 재주입한다. 백엔드가 EXIF 로 GPS·촬영시각을 읽어 이동 경로를 만든다.
 * - 텍스트 옵션: theme, bgm(빈 값이면 무음 → 미전송), 출발지(선택, 위·경도 함께).
 *   엔진은 항상 modal, 인트로/아웃트로는 항상 붙어 전송 필드가 없다.
 * - Content-Type 은 지정하지 않는다 — RN 의 XHR 이 FormData 를 감지해 boundary 자동 부착.
 * - 리사이즈 + 여러 사진 업로드가 전역 10s 를 넘길 수 있어 timeout 을 60s 로 override.
 *
 * 응답: reels_idx 즉시 반환(status=running). 이후 getRenderStatus 로 폴링.
 * 400: 사진 2장 미만 / GPS 있는 사진 2장 미만 / 모두 같은 장소 / 알 수 없는 테마 /
 *      출발지 좌표 오류 → 서버 message 를 그대로 사용자에게 노출. 401 / 404(BGM 없음).
 */
export async function renderPhotosOnly(
  photos: ReelsMediaAsset[],
  options: RenderOptions,
): Promise<VideoRenderStatusResponse> {
  const form = new FormData();

  // 각 사진 리사이즈·압축 + EXIF 재주입(병렬).
  const files = await Promise.all(
    photos.map((photo, index) => preparePhotoForUpload(photo, index)),
  );
  files.forEach((file) => {
    form.append("photos", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
  });

  form.append("theme", options.theme);
  // 빈 값(무음)은 아예 보내지 않는다(잘못된 곡명이면 404 이므로).
  if (options.bgm) form.append("bgm", options.bgm);
  // 출발지는 위·경도 둘 다 있을 때만.
  if (options.start_latitude != null && options.start_longitude != null) {
    form.append("start_name", options.start_name ?? "출발");
    form.append("start_latitude", String(options.start_latitude));
    form.append("start_longitude", String(options.start_longitude));
  }

  const res = await api.post<CommonResponse<VideoRenderStatusResponse>>(
    "/api/videos/render/photos-only",
    form,
    { timeout: 60000 },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * 렌더 진행률 조회. GET /api/videos/render/{reels_idx}.
 * 404: 존재하지 않는 릴스 → 호출부(queries.ts)에서 재시도 없이 표면화.
 */
export async function getRenderStatus(
  reelsIdx: number,
): Promise<VideoRenderStatusResponse> {
  const res = await api.get<CommonResponse<VideoRenderStatusResponse>>(
    `/api/videos/render/${reelsIdx}`,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
