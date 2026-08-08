import { File, Paths } from "expo-file-system";

import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";
import { getAccessToken } from "@/src/features/auth/storage";

import type { ReelsMediaAsset } from "@/src/features/reels/types";
import { preparePhotoForUpload } from "./photo-upload";
import type {
  BgmTrackResponse,
  RenderOptions,
  VideoEditResponse,
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
 * 사진→영상 렌더 시작. POST /api/videos/render/photos-ordered (multipart/form-data).
 *
 * photos-only 와 달리 **촬영 시각을 무시하고 보낸 순서 그대로** 지점을 이동한다 —
 * 화면 하단 타임라인의 드래그 순서가 곧 영상 순서다. GPS 좌표는 여전히 필요하고,
 * GPS 없는 사진은 서버가 알아서 뺀다.
 *
 * - photos: 업로드 전 각 사진을 리사이즈·압축한다(preparePhotoForUpload) — 원본을 그대로
 *   올리면 본문이 커져 413 이 난다. 리사이즈로 사라진 EXIF GPS·촬영시각은 앱이 가진
 *   좌표로 재주입한다. 백엔드가 EXIF 로 GPS 를 읽어 이동 경로를 만든다.
 * - 텍스트 옵션: theme, bgm(빈 값이면 무음 → 미전송), 출발지(선택, 위·경도 함께).
 *   엔진은 항상 modal, 인트로/아웃트로는 항상 붙어 전송 필드가 없다.
 * - Content-Type 은 지정하지 않는다 — RN 의 XHR 이 FormData 를 감지해 boundary 자동 부착.
 * - 리사이즈 + 여러 사진 업로드가 전역 10s 를 넘길 수 있어 timeout 을 60s 로 override.
 *
 * 응답: reels_idx 즉시 반환(status=running). 이후 getRenderStatus 로 폴링.
 * 400: 사진 2장 미만 / GPS 있는 사진 2장 미만 / 모두 같은 장소 / 알 수 없는 테마 /
 *      출발지 좌표 오류 → 서버 message 를 그대로 사용자에게 노출. 401 / 404(BGM 없음).
 */
export async function renderPhotosOrdered(
  photos: ReelsMediaAsset[],
  options: RenderOptions,
): Promise<VideoRenderStatusResponse> {
  const form = new FormData();

  // 각 사진 리사이즈·압축 + EXIF 재주입(병렬). Promise.all 은 입력 순서를 보존하므로
  // 아래 append 순서 = 사용자가 정렬한 순서 = 영상 순서다.
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
  if (options.title?.trim()) form.append("title", options.title.trim());
  // 출발지는 위·경도 둘 다 있을 때만.
  if (options.start_latitude != null && options.start_longitude != null) {
    form.append("start_name", options.start_name ?? "출발");
    form.append("start_latitude", String(options.start_latitude));
    form.append("start_longitude", String(options.start_longitude));
  }

  const res = await api.post<CommonResponse<VideoRenderStatusResponse>>(
    "/api/videos/render/photos-ordered",
    form,
    { timeout: 60000 },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * 내 완성 영상 다운로드. GET /api/videos/reels/{reels_idx}/download
 *
 * mp4 첨부 파일로 내려오므로 axios(JSON) 대신 파일 다운로드 API 를 쓴다.
 * 인터셉터를 안 타므로 Authorization 헤더를 직접 붙인다.
 * 남의 릴스는 존재 여부를 숨기려 403 이 아니라 404 로 온다(→ 호출부에서 안내).
 * 400: 아직 렌더 중 / 502: 저장소 접근 실패 / 401: 인증 필요.
 *
 * 캐시에 받아둔 뒤 호출부가 갤러리에 저장한다. 같은 릴스를 다시 받으면 덮어쓴다(idempotent).
 */
export async function downloadMyReelsVideo(reelsIdx: number): Promise<string> {
  const token = await getAccessToken();
  const file = await File.downloadFileAsync(
    `${process.env.EXPO_PUBLIC_API_URL}/api/videos/reels/${reelsIdx}/download`,
    new File(Paths.cache, `reels_${reelsIdx}.mp4`),
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      idempotent: true,
    },
  );
  return file.uri;
}

/**
 * 완성된 릴스 영상에서 [start, end) 구간 삭제. POST /api/videos/edit/cut (urlencoded).
 *
 * 서버가 새 영상을 버킷에 올리고 릴스의 url 을 교체한 뒤 **편집 전 영상은 지운다** —
 * 되돌릴 수 없다. 400: 렌더 미완료·구간 오류·영상 전체 삭제 시도 / 404: 남의 릴스·없음 /
 * 502: ffmpeg 실패. ffmpeg 재인코딩이라 응답이 느려 timeout 을 늘려 잡는다.
 */
export async function cutVideoSection(
  reelsIdx: number,
  startSeconds: number,
  endSeconds: number,
): Promise<VideoEditResponse> {
  const body = new URLSearchParams({
    reels_idx: String(reelsIdx),
    start_seconds: String(startSeconds),
    end_seconds: String(endSeconds),
  });
  const res = await api.post<CommonResponse<VideoEditResponse>>(
    "/api/videos/edit/cut",
    body.toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 120000,
    },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * 완성된 릴스 영상 at_seconds 시점에 사진 끼워넣기. POST /api/videos/edit/insert (multipart).
 *
 * 사진이 머무는 시간은 서버 고정(렌더의 사진 1장 시간과 동일). cut 과 마찬가지로
 * 편집 전 영상은 지워진다 — 되돌릴 수 없다.
 */
export async function insertImageClip(
  reelsIdx: number,
  atSeconds: number,
  photo: ReelsMediaAsset,
): Promise<VideoEditResponse> {
  const form = new FormData();
  form.append("reels_idx", String(reelsIdx));
  form.append("at_seconds", String(atSeconds));
  // 렌더 업로드와 같은 리사이즈·압축 경로 — 원본을 그대로 올리면 413 이 난다.
  const file = await preparePhotoForUpload(photo, 0);
  form.append("image", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  const res = await api.post<CommonResponse<VideoEditResponse>>(
    "/api/videos/edit/insert",
    form,
    { timeout: 120000 },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * 릴스 공유 링크. GET /api/videos/reels/{reels_idx}/share
 *
 * 영상이 재생되는 공유 페이지(/r/{reels_idx}) 주소 — 버킷 영상 주소와 달리 카톡·SNS 에서
 * 링크 미리보기가 뜬다. 남의 릴스도 조회 가능하고 로그인도 필요 없다.
 * 404: 없거나 삭제됐거나 아직 렌더 중.
 */
export async function getReelsShareUrl(reelsIdx: number): Promise<string> {
  const res = await api.get<CommonResponse<{ share_url: string }>>(
    `/api/videos/reels/${reelsIdx}/share`,
  );
  if (!res.data.data?.share_url) throw new Error(res.data.message);
  return res.data.data.share_url;
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
